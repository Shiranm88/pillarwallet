// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

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

import React, { useCallback, type AbstractComponent } from 'react';
import { connect } from 'react-redux';
import { Dimensions, Share, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import styled from 'styled-components/native';
import t from 'translations/translate';
import { createStructuredSelector } from 'reselect';

// components
import { BaseText } from 'components/Typography';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import QRCodeWithTheme from 'components/QRCode';
import Toast from 'components/Toast';
import ProfileImage from 'components/ProfileImage';
import TextWithCopy from 'components/modern/TextWithCopy';

// utils
import { spacing, fontStyles, baseColors } from 'utils/variables';
import { getAccountEnsName } from 'utils/accounts';

// models and types
import type { Account } from 'models/Account';
import type { RootReducerState } from 'reducers/rootReducer';
import type { User } from 'models/User';

// selectors
import { activeAccountSelector } from 'selectors';

type StateProps = {|
  user: User,
  activeAccount: ?Account,
|};

type OwnProps = {|
  address: string,
  handleBuyTokens?: Function,
  onModalHide?: Function,
  showBuyTokensButton?: boolean,
  showErc20Note?: boolean,
|};

type Props = {|
  ...StateProps,
  ...OwnProps,
|};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const handleCopyToClipboard = (addressOrEnsName: string, ensCopy?: boolean) => {
  Clipboard.setString(addressOrEnsName);
  const message = ensCopy ? t('toast.ensNameCopiedToClipboard') : t('toast.addressCopiedToClipboard');
  Toast.show({ message, emoji: 'ok_hand' });
};

const ReceiveModal = ({
  activeAccount,
  address,
  onModalHide,
  showBuyTokensButton = false,
  user,
}: Props) => {
  const handleAddressShare = useCallback(() => {
    Share.share({ title: t('title.publicAddress'), message: address });
  }, [address]);

  const { username } = user;
  const ensName = getAccountEnsName(activeAccount);
  const needsSmallButtons = showBuyTokensButton && SCREEN_WIDTH < 300;

  return (
    <SlideModal
      onModalHide={onModalHide}
      noPadding
      noClose
      centerFloatingItem={
        <ImageWrapper style={{ position: 'absolute', marginTop: -24 }}>
          <ProfileImage userName={username} diameter={48} />
        </ImageWrapper>
      }
    >
      <ContentWrapper forceInset={{ top: 'never', bottom: 'always' }}>
        <InfoView>
          {!!ensName && (
            <TextWithCopy textToCopy={ensName} iconColor="#007aff">
              {ensName}
            </TextWithCopy>
          )}
          <WalletAddress>{address}</WalletAddress>
        </InfoView>
        <QRCodeWrapper>{!!address && <QRCodeWithTheme value={address} size={104} />}</QRCodeWrapper>
        <WarningText center small>
          {t('paragraph.cautionMessage', {
            ethereum: t('chains.ethereum'),
            mediumText: true,
            color: '#62688f',
          })}{' '}
          <BaseText style={{ color: baseColors.dodgerBlue }}>{t('paragraph.withCaution')}</BaseText>
        </WarningText>
        <CopyButton>
          <Button
            title={t('button.copyAddress')}
            onPress={() => handleCopyToClipboard(address)}
            small={needsSmallButtons}
          />
        </CopyButton>
        <ShareButton>
          <Button title={t('button.shareAddress')} onPress={handleAddressShare} small={needsSmallButtons} secondary />
        </ShareButton>
      </ContentWrapper>
    </SlideModal>
  );
};

const mapStateToProps = ({
  user: { data: user },
}: RootReducerState): $Shape<StateProps> => ({
  user,
});

const structuredSelector = createStructuredSelector({
  activeAccount: activeAccountSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<StateProps> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default (connect(combinedMapStateToProps)(ReceiveModal): AbstractComponent<OwnProps>);

const ContentWrapper = styled(SafeAreaView)`
  padding: 0 ${spacing.layoutSides}px 30px;
  align-items: center;
`;

const QRCodeWrapper = styled.View`
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin: ${spacing.largePlus}px;
`;

const WalletAddress = styled(BaseText)`
  ${fontStyles.regular};
  color: ${({ theme }) => theme.colors.basic030};
  margin: ${spacing.mediumLarge}px;
  text-align: center;
`;

const CopyButton = styled.View`
  width: 100%;
  justify-content: space-between;
  margin-top: ${spacing.largePlus}px;
  margin-bottom: ${spacing.small}px;
`;

const ShareButton = styled.View`
  width: 100%;
  justify-content: space-between;
  margin-bottom: ${spacing.medium}px;
`;

const InfoView = styled.View`
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const ImageWrapper = styled.View`
  width: 100%;
  align-items: center;
  justify-content: center;
`;

const WarningText = styled(BaseText)`
  ${fontStyles.regular};
  color: ${({ theme }) => theme.colors.basic030};
  margin-top: ${spacing.medium}px;
  text-align: center;
`;
