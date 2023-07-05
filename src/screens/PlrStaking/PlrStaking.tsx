import React, { useState, useEffect } from 'react';
import { Image } from 'react-native';
import { useTranslationWithPrefix } from 'translations/translate';
import styled from 'styled-components/native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import { BigNumber, ethers } from 'ethers';
import { addDays, format, intervalToDuration } from 'date-fns';

// Constants
import { PLR_STAKING_VALIDATOR } from 'constants/navigationConstants';
import {
  MIN_PLR_STAKE_AMOUNT,
  STAKING_LOCKED_PERIOD,
  STAKING_PERIOD,
  WalletType,
  plrSupportedChains,
} from 'constants/plrStakingConstants';

// Hooks
import { useStableAssets, useNonStableAssets } from 'hooks/assets';

// Utils
import { fontStyles, spacing } from 'utils/variables';
import { formatBigAmount } from 'utils/common';

// Selectors
import { useSupportedChains } from 'selectors/chains';

// Configs
import { getPlrAddressForChain } from 'configs/assetsConfig';
import { useChainsConfig } from 'utils/uiConfig';

// Components
import { Container, Content } from 'components/layout/Layout';
import Button from 'components/core/Button';
import Text from 'components/core/Text';
import Icon from 'components/core/Icon';
import RadioButton from 'components/RadioButton';
import { Spacing } from 'components/legacy/Layout';
import AssetSelectorModal from 'components/Modals/AssetSelectorModal';

// Local
import PlrStakingHeaderBlock from './PlrStakingHeaderBlock';
import { getStakingContractInfo, getStakingRemoteConfig } from 'utils/plrStakingHelper';

const PlrStaking = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t, tRoot } = useTranslationWithPrefix('plrStaking');

  const chains: string[] = useSupportedChains();
  const chainsConfig = useChainsConfig();

  const { tokens: stableTokens } = useStableAssets();
  const { tokens: nonStableTokens } = useNonStableAssets();
  const tokens = [...stableTokens, ...nonStableTokens];

  // Contract data
  const [stakingEnabled, setStakingEnabled] = useState(null);
  const [stakedAmount, setStakedAmount] = useState(null);
  const [stakedPercentage, setStakedPercentage] = useState(null);
  const [stakers, setStakers] = useState(0);

  // Remote Config
  const [stakingEndTime, setStakingEndTime] = useState<Date>(null);
  const [stakingLockedEndTime, setStakingLockedEndTime] = useState<Date>(null);

  const [remainingStakingTime, setRemainingStakingTime] = useState<Duration>(null);
  const [remainingLockedTime, setRemainingLockedTime] = useState<Duration>(null);

  const [balancesWithoutPlr, setBalancesWithoutPlr] = useState(null);
  const [plrBalances, setPlrBalances] = useState(null);
  const [hasEnoughPlr, setHasEnoughPlr] = useState(false);

  const [selectedWallet, setSelectedWallet] = useState(WalletType.ETHERSPOT);
  const [selectedChain, setSelectedChain] = useState(null);

  const [showModal, setShowModal] = useState(false);

  const getRemainingTimes = () => {
    if (stakingEndTime) {
      const stakingDuration = intervalToDuration({ start: new Date(), end: stakingEndTime });
      setRemainingStakingTime(stakingDuration);
    }

    if (stakingLockedEndTime) {
      const lockedDuration = intervalToDuration({ start: new Date(), end: stakingLockedEndTime });
      setRemainingLockedTime(lockedDuration);
    }
  };

  useEffect(() => {
    const fetchStakingInfo = async () => {
      const stakingRemoteConfig = getStakingRemoteConfig();
      const startTime = new Date(stakingRemoteConfig.stakingStartTime * 1000);

      const lockedStartTime = new Date(stakingRemoteConfig.stakingLockedStartTime * 1000);

      const endTime = addDays(startTime, STAKING_PERIOD);
      const lockedEndTime = addDays(lockedStartTime, STAKING_LOCKED_PERIOD);
      setStakingEndTime(endTime);
      setStakingLockedEndTime(lockedEndTime);

      const stakingInfo = await getStakingContractInfo();
      try {
        setStakingEnabled(!!stakingInfo.contractState);

        const stakingMaxTotal = BigNumber.from(stakingInfo.maxStakeTotal.toString());
        const totalStaked = BigNumber.from(stakingInfo.totalStaked.toString());
        const percentage = Number(totalStaked.mul(100).div(stakingMaxTotal)) / 100;

        setStakedAmount(formatBigAmount(ethers.utils.formatEther(totalStaked)));
        setStakedPercentage(percentage.toFixed(0).toString());
        setStakers(0);
      } catch (e) {
        //
      }
    };

    const plrAddresses: string[] = [];
    chains.map((chain) => {
      const plrAddress = getPlrAddressForChain(chain);
      if (!!plrAddress) plrAddresses.push(plrAddress.toLowerCase());
    });

    const filteredWithoutPlr = tokens.filter(
      (token) =>
        !plrAddresses.includes(token?.address?.toLowerCase()) &&
        plrSupportedChains.includes(token.chain) &&
        token.assetBalance > 0,
    );

    const filteredTokens = tokens
      .filter((token) => plrAddresses.includes(token?.address?.toLowerCase()))
      .sort((a, b) => b?.assetBalance - a?.assetBalance);

    if (!filteredTokens?.length) {
      setHasEnoughPlr(false);
      return;
    }

    fetchStakingInfo();

    setSelectedChain(filteredTokens[0].chain);
    setHasEnoughPlr(filteredTokens[0].assetBalance >= MIN_PLR_STAKE_AMOUNT);
    setPlrBalances(filteredTokens);
    setBalancesWithoutPlr(filteredWithoutPlr);
  }, []);

  useEffect(() => {
    if (!stakingEndTime) return;

    console.log();

    const timerCountdown = setInterval(getRemainingTimes, 1000);
    return () => clearInterval(timerCountdown);
  }, [stakingEndTime]);

  const getPlrTotal = () => {
    if (!plrBalances?.length) return 0;

    let total = 0;
    let symbol = '';
    plrBalances.map((bal) => {
      if (!symbol) symbol = bal?.symbol || '';
      total += parseFloat(bal?.assetBalance || 0);
    });

    return `${total.toFixed(2)} ${symbol}`;
  };

  const getPlrFiatTotal = () => {
    if (!plrBalances?.length) return 0;

    let total = 0;
    let symbol = '';
    plrBalances.map((bal) => {
      if (!symbol) symbol = bal?.formattedBalanceInFiat?.substring(0, 1) || '';
      total += parseFloat(bal?.balance?.balanceInFiat || 0);
    });

    return symbol + total.toFixed(2);
  };

  const selectChain = (chain) => {
    const balance = plrBalances.find((bal) => bal.chain === chain);

    if (!balance || balance.assetBalance < MIN_PLR_STAKE_AMOUNT) return;

    setSelectedChain(chain);
  };

  const onSelectToken = (token) => {
    setShowModal(false);
    navigation.navigate(PLR_STAKING_VALIDATOR, {
      token: token,
      chain: token.chain,
      wallet: selectedWallet,
      balancesWithoutPlr: balancesWithoutPlr,
    });
  };

  const onChooseAsset = () => {
    setShowModal(true);
  };

  const onStake = () => {
    const token = plrBalances.find((bl) => bl?.chain === selectedChain);
    if (!token) return;

    navigation.navigate(PLR_STAKING_VALIDATOR, {
      token: token,
      chain: token.chain,
      wallet: selectedWallet,
      balancesWithoutPlr: balancesWithoutPlr,
    });
  };

  const formatRemainingTime = (time: Duration) => {
    let timeStr = '';
    if (!time) return timeStr;

    if (time.months) timeStr += ` ${time.months} months`;
    if (time.days) timeStr += ` ${time.days} days`;
    if (time.hours) timeStr += ` ${time.hours}h`;
    if (time.minutes) timeStr += ` ${time.minutes}m`;
    if (time.seconds) timeStr += ` ${time.seconds}s`;

    return timeStr?.slice(1) || '';
  };

  return (
    <Container>
      <PlrStakingHeaderBlock
        centerItems={[{ title: t('title') }]}
        leftItems={[{ close: true }]}
        navigation={navigation}
        noPaddingTop
        stakedAmount={stakedAmount}
        stakedPercentage={stakedPercentage}
        stakers={stakers}
      />
      <Content>
        <IconRow>
          <StakingAlertCircle />
          <Spacing w={8} />
          {stakingEnabled == null ? (
            <InfoText>{`Staking info is loading...`}</InfoText>
          ) : stakingEnabled ? (
            <InfoText>
              {`Staking will close in `} <InfoText bold>{formatRemainingTime(remainingStakingTime)}</InfoText>
            </InfoText>
          ) : (
            <InfoText>{'Staking is currently closed'}</InfoText>
          )}
        </IconRow>

        <Spacing h={spacing.mediumLarge} />

        <InfoText>{t('info')}</InfoText>

        {!!plrBalances?.length && (
          <PlrBalancesWrapper>
            <PlrAvailableText>
              {t('plrAvailable', { chainAmount: plrBalances.length, s: plrBalances.length > 1 ? 's' : '' })}
            </PlrAvailableText>
            <AvailablePlrBox>
              <AvailablePlrTokenWrapper>
                <Icon name="plr32" />
                <PlrTitle>{t('pillar')}</PlrTitle>
              </AvailablePlrTokenWrapper>

              <AvailablePlrBoxTextWrapper>
                <AvailablePlrText>{getPlrTotal()}</AvailablePlrText>
                <AvailablePlrFiatText>{getPlrFiatTotal()}</AvailablePlrFiatText>
              </AvailablePlrBoxTextWrapper>
            </AvailablePlrBox>

            <BalanceSelectWrapper>
              <BalanceItem disabled>
                <BalanceLeftItem>
                  <Icon name="etherspot16" />
                  <BalanceTitle>Etherspot Wallet</BalanceTitle>
                  <Icon name="checkmark-green" />
                </BalanceLeftItem>

                <BalanceRightItem>
                  <BalanceValueText>{getPlrTotal()}</BalanceValueText>
                  <BalanceValueText fiat>{getPlrFiatTotal()}</BalanceValueText>
                </BalanceRightItem>
              </BalanceItem>

              {plrBalances.map((bal) => {
                const { titleShort } = chainsConfig[bal.chain];

                const disabled = bal?.assetBalance < MIN_PLR_STAKE_AMOUNT;

                return (
                  <BalanceItem onClick={() => selectChain(bal.chain)} disabled={disabled}>
                    <BalanceLeftItem>
                      <Spacing w={spacing.large} />
                      <RadioButton visible={bal.chain === selectedChain} disabled={disabled} />
                      <Spacing w={spacing.small} />
                      {/* @ts-ignore */}
                      <Icon name={bal.chain + 16} />
                      <BalanceTitle disabled={disabled}>{titleShort}</BalanceTitle>
                    </BalanceLeftItem>

                    <BalanceRightItem>
                      <BalanceValueText disabled={disabled}>
                        {`${parseFloat(bal.assetBalance).toFixed(2)} ${bal.symbol}`}
                      </BalanceValueText>
                      <BalanceValueText fiat disabled={disabled}>
                        {bal.formattedBalanceInFiat}
                      </BalanceValueText>
                    </BalanceRightItem>
                  </BalanceItem>
                );
              })}
            </BalanceSelectWrapper>
          </PlrBalancesWrapper>
        )}

        {!plrBalances?.length || (!hasEnoughPlr && <LimitWarningText>{t('limitWarning')}</LimitWarningText>)}

        <ContinueButtonWrapper>
          {!!hasEnoughPlr && (
            <Button
              title={t('button.stake')}
              onPress={onStake}
              size="large"
              disabled={!selectedWallet || !selectedChain || !stakingEnabled}
            />
          )}

          {!hasEnoughPlr && <Button title={t('button.chooseAsset')} onPress={onChooseAsset} size="large" />}
        </ContinueButtonWrapper>
      </Content>

      <AssetSelectorModal
        visible={showModal}
        onCloseModal={() => setShowModal(false)}
        title={t('chooseAsset')}
        tokens={balancesWithoutPlr}
        onSelectToken={onSelectToken}
      />
    </Container>
  );
};

const InfoText = styled(Text)<{ bold?: boolean }>`
  color: ${({ theme }) => theme.colors.basic010};
  ${fontStyles.regular};
  ${({ bold }) => bold && `font-weight: 500;`};
`;

const LimitWarningText = styled(Text)`
  color: ${({ theme }) => theme.colors.basic000};
  margin-top: 76px;
  text-align: center;
`;

const PlrAvailableText = styled(Text)`
  color: ${({ theme }) => theme.colors.basic000};
`;

const ContinueButtonWrapper = styled.View`
  width: 100%;
  justify-content: space-between;
  margin-top: ${spacing.largePlus}px;
  margin-bottom: ${spacing.small}px;
`;

const PlrBalancesWrapper = styled.View`
  margin-top: ${spacing.large}px;
`;

const AvailablePlrBox = styled.View`
  display: flex;
  flex: 1;
  justify-content: space-between;
  flex-direction: row;

  padding: 10px 16px 12px;
  margin-top: ${spacing.small}px;
  border-radius: 8px;
  ${({ theme }) => `
    background-color: ${theme.colors.plrStaking}
    border: solid 1px ${theme.colors.plrStakingAlt};
  `};
`;

const AvailablePlrBoxTextWrapper = styled.View`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
`;

const AvailablePlrText = styled(Text)`
  color: ${({ theme }) => theme.colors.link};
  ${fontStyles.medium};
  font-weight: 500;
`;

const AvailablePlrFiatText = styled(Text)`
  color: ${({ theme }) => theme.colors.secondaryText};
  ${fontStyles.medium};
`;

const AvailablePlrTokenWrapper = styled.View`
  display: flex;
  flex: 1;
  justify-content: flex-start;
  align-items: center;
  flex-direction: row;
`;

const PlrTitle = styled(Text)`
  color: ${({ theme }) => theme.colors.link};
  ${fontStyles.medium};
  margin-left: ${spacing.small}px;
`;

const BalanceSelectWrapper = styled.View`
  margin-top: ${spacing.mediumLarge}px;
`;

const BalanceItem = styled.TouchableOpacity.attrs((props: { disabled?: boolean }) => props)`
  margin-bottom: ${spacing.small}px;
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  ${({ disabled }) => disabled && 'opacity: 0.6;'};
`;

const BalanceLeftItem = styled.View`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
`;

const BalanceRightItem = styled.View`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
`;

const BalanceTitle = styled(Text)`
  color: ${({ theme }) => theme.colors.link};
  ${fontStyles.regular};
  margin: 0 ${spacing.small}px;
`;

const BalanceValueText = styled(Text).attrs((props: { fiat?: boolean }) => props)`
  ${fontStyles.regular};
  color: ${({ theme, fiat }) => (!!fiat ? theme.colors.secondaryText : theme.colors.link)};
  margin-left: ${spacing.small}px;
`;

const IconRow = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const StakingAlertCircle = styled.View`
  width: 12px;
  height: 12px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.plrStakingAlert};
`;

export default PlrStaking;
