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
import React from 'react';
import t from 'translations/translate';
import { useNavigation, useNavigationParam } from 'react-navigation-hooks';
import styled from 'styled-components/native';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import PoolTokenIcon from 'components/display/PoolTokenIcon';
import { Spacing } from 'components/legacy/Layout';
import Spinner from 'components/Spinner';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';

// Utils
import { useChainConfig } from 'utils/uiConfig';
import { usePoolsActivityQuery } from 'utils/etherspot';

// models, types
import type { AssetDataNavigationParam } from 'models/Asset';

// Local
import AnimatedFloatingActions from './AnimatedFloatingActions';
import PoolActivityHeaderContent from './components/PoolActivityHeaderContent';
import PoolActivityList from './components/PoolActivityList';

const PoolsActivityScreen = () => {
  const navigation = useNavigation();

  const assetData: AssetDataNavigationParam = useNavigationParam('assetData');
  const tokenDetails = useNavigationParam('tokenDetails');
  const { chain, imageUrl, token } = assetData;

  const config = useChainConfig(chain);

  const poolsActivityQuery = usePoolsActivityQuery(assetData);
  const { data: poolsActivityData, isLoading } = poolsActivityQuery;

  const renderEmptyState = () => {
    if (isLoading) return <Spinner />;
    return (
      <EmptyStateWrapper>
        <EmptyStateParagraph title={t('label.nothingFound')} />
      </EmptyStateWrapper>
    );
  };

  return (
    <Container>
      <HeaderBlock
        centerItems={[
          {
            custom: <PoolTokenIcon url={imageUrl} chain={chain} size={24} />,
          },
          { title: ` ${config.gasSymbol}-${token} ${t('label.pool_activity')}` },
        ]}
        navigation={navigation}
        noPaddingTop
      />
      <Container style={{ alignItems: 'center' }}>
        <Spacing h={20} />
        <PoolActivityHeaderContent chain={chain} tokenDetails={tokenDetails} />

        <Spacing h={36} />

        <List
          data={poolsActivityData?.items}
          bounces={false}
          renderItem={({ item }) => <PoolActivityList data={item} />}
          ListEmptyComponent={renderEmptyState}
          style={{ width: '100%' }}
          contentContainerStyle={{ paddingBottom: 120 }}
        />

        <Spacing h={10} />
      </Container>
      <AnimatedFloatingActions assetData={assetData} />
    </Container>
  );
};

const List = styled.FlatList``;

const EmptyStateWrapper = styled.View`
  flex: 1;
  padding-top: 90px;
  padding-bottom: 90px;
  align-items: center;
`;

export default PoolsActivityScreen;
