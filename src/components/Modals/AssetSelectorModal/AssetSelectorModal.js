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

import * as React from 'react';
import { Keyboard } from 'react-native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import SlideModal from 'components/Modals/SlideModal';

// Utils
import { useThemeColors } from 'utils/themes';

// Types
import type { AssetOption } from 'models/Asset';
import type { Collectible } from 'models/Collectible';

// Local
import AssetSelectorContent from './AssetSelectorContent';

type Props = {|
  tokens: AssetOption[],
  onSelectToken: (asset: AssetOption) => mixed,
  collectibles?: Collectible[],
  onSelectCollectible?: (collectible: Collectible) => mixed,
  title?: string,
  autoFocus?: boolean,
  isFromSelect?: boolean,
|};

const AssetSelectorModal = ({
  tokens,
  collectibles,
  onSelectToken,
  onSelectCollectible,
  title,
  autoFocus = false,
  isFromSelect,
}: Props) => {
  const { t } = useTranslationWithPrefix('assetSelector');
  const colors = useThemeColors();
  const [selectedAssetChain, setSelectedAssetChain] = React.useState(null);

  const modalRef = React.useRef(null);

  const close = () => {
    Keyboard.dismiss();
    modalRef.current?.close();
  };

  const selectToken = (option: AssetOption) => {
    close();
    onSelectToken(option);
  };

  const selectCollectible = (collectible: Collectible) => {
    close();
    onSelectCollectible?.(collectible);
  };

  title = (selectedAssetChain ? t('choose_token', { chain: selectedAssetChain }) : title) || t('title');

  return (
    <SlideModal ref={modalRef} fullScreen noSwipeToDismiss noClose backgroundColor={colors.basic050} noTopPadding>
      <Container>
        <HeaderBlock leftItems={[{ close: true }]} centerItems={[{ title }]} onClose={close} noPaddingTop />

        <AssetSelectorContent
          isFromSelect={isFromSelect}
          tokens={tokens}
          selectedAssetChain={selectedAssetChain}
          onSelectAssetChain={setSelectedAssetChain}
          onSelectToken={selectToken}
          collectibles={collectibles}
          onSelectCollectible={selectCollectible}
          autoFocus={autoFocus}
        />
      </Container>
    </SlideModal>
  );
};

export default AssetSelectorModal;
