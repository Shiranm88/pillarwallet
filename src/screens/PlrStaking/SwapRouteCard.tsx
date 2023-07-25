// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

import React, { FC, useState, useEffect } from 'react';
import styled from 'styled-components/native';
import { BigNumber } from 'bignumber.js';
import { useTranslationWithPrefix } from 'translations/translate';

// Utils
import { formatTokenValue } from 'utils/format';
import { fontStyles } from 'utils/variables';
import { useChainsConfig } from 'utils/uiConfig';

// Types
import type { Asset, AssetOption } from 'models/Asset';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { Chain } from 'models/Chain';

// Components
import Text from 'components/core/Text';
import { Spacing } from 'components/layout/Layout';
import RouteCard from './RouteCard';

interface ISwapRouteCard {
  value?: BigNumber;
  selectedToken?: AssetOption;
  chain?: Chain;
  offers?: any;
  selectedOffer?: any;
  disabled?: boolean;
  onEstimateFail?: () => void;
  gasFeeAsset: Asset | AssetOption;
  plrToken?: AssetOption;
  setStkPlrAmount?: (value: BigNumber) => void;
  setOfferData?: (offer: any) => void;
  onFeeInfo?: (feeInfo: TransactionFeeInfo | null) => void;
  stakeFeeInfo: any;
  stakeGasFeeAsset: Asset | AssetOption;
}

const SwapRouteCard: FC<ISwapRouteCard> = ({
  value,
  selectedToken,
  chain,
  offers,
  selectedOffer = null,
  disabled,
  onEstimateFail,
  gasFeeAsset,
  plrToken,
  setOfferData,
  setStkPlrAmount,
  onFeeInfo,
  stakeFeeInfo,
  stakeGasFeeAsset,
}) => {
  const { t } = useTranslationWithPrefix('plrStaking.validator');

  const chainsConfig = useChainsConfig();
  const { titleShort: networkName } = chainsConfig[chain];

  const [selectedOfferProvider, setSelectedOfferProvider] = useState(null);

  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    setOfferData(offers[0]);
    setSelectedOfferProvider(offers[0].provider);
    setStkPlrAmount(offers[0]?.toAmount || null);
  }, []);

  const formattedToAmount = formatTokenValue(selectedOffer?.toAmount, 'stkPLR', { decimalPlaces: 0 }) ?? '';

  const formattedFromAmount =
    formatTokenValue(selectedOffer?.fromAmount, selectedOffer?.fromAsset.symbol, { decimalPlaces: 0 }) ?? '';

  const onSelectOffer = (offer: any, feeInfo: TransactionFeeInfo | null) => {
    if (!offer?.provider || selectedOffer?.provider === offer.provider || !feeInfo) return;

    setOfferData?.(offer);
    onFeeInfo?.(offer?.feeInfo);
    setSelectedOfferProvider(offer.provider);
  };

  if (!offers?.length) return null;

  return (
    <>
      {selectedOffer && (
        <>
          <Spacing h={8} />

          <RouteCard
            selected={selectedOffer?.provider === selectedOfferProvider}
            chain={selectedToken?.chain}
            plrToken={plrToken}
            formattedFromAmount={formattedFromAmount}
            formattedToAmount={formattedToAmount}
            networkName={networkName}
            stakeFeeInfo={stakeFeeInfo}
            stakeGasFeeAsset={stakeGasFeeAsset}
            provider={selectedOfferProvider}
            gasFeeAsset={gasFeeAsset}
            transactions={selectedOffer?.transactions}
          />
        </>
      )}

      {!disabled &&
        (!selectedOffer || showMore) &&
        offers.map((offer, i) => {
          const formattedToAmount = formatTokenValue(offer.toAmount, 'stkPLR', { decimalPlaces: 0 }) ?? '';

          const formattedFromAmount =
            formatTokenValue(offer.fromAmount, offer.fromAsset.symbol, { decimalPlaces: 0 }) ?? '';

          if (!selectedOffer && !showMore && i !== 0) return null;
          if (!offer?.provider || offer.provider === selectedOfferProvider) return null;
          return (
            <>
              <Spacing h={8} />

              <RouteCard
                offer={offer}
                selected={offer.provider === selectedOfferProvider}
                chain={selectedToken?.chain}
                plrToken={plrToken}
                formattedFromAmount={formattedFromAmount}
                formattedToAmount={formattedToAmount}
                networkName={networkName}
                provider={offer?.provider}
                onSelectOffer={onSelectOffer}
                stakeFeeInfo={stakeFeeInfo}
                stakeGasFeeAsset={stakeGasFeeAsset}
                gasFeeAsset={gasFeeAsset}
                transactions={offer?.transactions}
              />
            </>
          );
        })}

      {!disabled && offers?.length > 1 && (
        <>
          <Spacing h={16} />

          <ShowMoreButton onPress={() => setShowMore((current) => !current)}>
            <ShowMoreText>{showMore ? t('showLess') : t('showMore')}</ShowMoreText>
          </ShowMoreButton>
        </>
      )}
    </>
  );
};

export default SwapRouteCard;

const EmptyStateWrapper = styled.View`
  justify-content: center;
  align-items: center;
`;

const RouteText = styled(Text)`
  ${fontStyles.big};
  color: ${({ theme }) => theme.colors.basic010};
`;

// Routes
const RouteWrapper = styled.View`
  flex-direction: column;
`;

const RouteContainer = styled.View`
  margin: 0 0 8px;
  padding: 20px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.colors.basic050};

  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const IconWrapper = styled.View`
  align-items: center;
  justify-content: center;
`;

const RouteInfoWrapper = styled.View`
  display: flex;
  flex: 1;
  flex-direction: column;
  padding-left: 16px;
  justify-content: center;
`;

const RouteInfoRow = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const MainText = styled(Text).attrs((props: { highlighted?: boolean }) => props)`
  ${fontStyles.medium};

  color: ${({ theme, highlighted }) => (highlighted ? theme.colors.plrStakingHighlight : theme.colors.basic000)};
`;

const SubText = styled(Text).attrs((props: { highlighted?: boolean }) => props)`
  ${fontStyles.regular};

  color: ${({ theme, highlighted }) => (highlighted ? theme.colors.plrStakingHighlight : theme.colors.basic000)};
`;

const RadioButtonWrapper = styled.View`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const HighlightText = styled(Text)`
  color: ${({ theme }) => theme.colors.plrStakingHighlight};
`;

const ShowMoreButton = styled.TouchableOpacity`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ShowMoreText = styled(Text)`
  color: ${({ theme }) => theme.colors.basic000};
`;
