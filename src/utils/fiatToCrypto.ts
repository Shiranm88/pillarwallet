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

import { Account, AccountStates, GatewayTransactionStates, NotificationTypes, Sdk } from 'etherspot';
import WertWidget from '@wert-io/widget-initializer';
import { map } from 'rxjs/operators';
import { useTranslationWithPrefix } from 'translations/translate';

// Services
import { firebaseRemoteConfig } from 'services/firebase';

// Constants
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';
import { CHAIN_ID } from 'constants/chainConstants';

// Config
import { getEnv } from 'configs/envConfig';
import { ARCHANOVA_RAMP_CURRENCY_TOKENS, ETHERSPOT_RAMP_CURRENCY_TOKENS } from 'configs/rampConfig';
import { CONTAINER_ID, ORIGIN } from 'configs/wertConfig';

// Services
import etherspotService from 'services/etherspot';

// Utils
import { chainFromChainId } from 'utils/chains';

const PILLAR = 'Pillar';

export const buildUrlOptions = (options: { [key: string]: string }): string => {
  let optionStr = '';
  Object.keys(options).map((key: string) => {
    let value = options[key];
    optionStr += `${!optionStr ? '?' : '&'}${key}=${encodeURIComponent(value)}`;
  });
  return optionStr;
};

// RAMP
export const rampWidgetUrl = (
  address: string,
  fiatCurrency: string = '',
  fiatValue: string = '',
  isEtherspotAccount: boolean = true,
) => {
  const params = {
    hostAppName: PILLAR,
    hostApiKey: getEnv().RAMPNETWORK_API_KEY,
    userAddress: address,
    fiatCurrency,
    fiatValue,
    swapAsset: isEtherspotAccount ? ETHERSPOT_RAMP_CURRENCY_TOKENS.join(',') : ARCHANOVA_RAMP_CURRENCY_TOKENS,
  };

  const url = `${getEnv().RAMPNETWORK_WIDGET_URL}/${buildUrlOptions(params)}`;
  return url;
};

// WERT
export const wertWidgetUrl = (address: string, fiatValue: string) => {
  const wertWidget = new WertWidget({
    partner_id: getEnv().WERT_ID,
    container_id: CONTAINER_ID,
    origin: ORIGIN,
    commodities: firebaseRemoteConfig.getString(REMOTE_CONFIG.FEATURE_WERT_COMMODITIES),
    currency: firebaseRemoteConfig.getString(REMOTE_CONFIG.FEATURE_WERT_CURRENCY),
    currency_amount: parseFloat(fiatValue),
    commodity: firebaseRemoteConfig.getString(REMOTE_CONFIG.FEATURE_WERT_COMMODITY),
    address,
  });

  return wertWidget.getEmbedUrl();
};

// Pelerin
export const buildMtPelerinOptions = (code: string, address: string) => {
  let onRampOptions = {
    lang: 'en',
    tab: 'buy',
    tabs: 'buy',
    chain: 'xdai_mainnet',
    net: 'matic_mainnet',
    nets: 'arbitrum_mainnet,avalanche_mainnet,bsc_mainnet,fantom_mainnet,mainnet,optimism_mainnet,xdai_mainnet',
    crys: 'AVAX,BNB,BTCB,BUSD,DAI,ETH,FRAX,LUSD,MAI,MATIC,RBTC,RDOC,RIF,USDC,USDT,WBTC,WETH,XCHF,XDAI,XTZ',
    rfr: 'etherspot',
    bsc: 'GBP',
    bdc: 'MATIC',
    hash: '',
    code: code,
    addr: address || '',
  };

  return onRampOptions;
};

export const pelerinWidgetUrl = async (
  deployingAccount = false,
  setDeployingAccount?: (value: boolean) => void,
  showAlert?: (message: string) => void,
) => {
  const { t } = useTranslationWithPrefix('servicesContent.ramp.addCash.pelerinWidget');

  const chain = chainFromChainId[CHAIN_ID.XDAI];

  const sdk: Sdk | undefined = etherspotService.getSdkForChain(chain);
  const account: Account | undefined = await etherspotService.getAccount(chain);

  let base64Hash = '';
  const code = Math.floor(Math.random() * 8999) + 1000;
  const message = 'MtPelerin-' + code;
  let onRampOptions = buildMtPelerinOptions(code.toString(), account.address);

  if (account?.state === AccountStates.UnDeployed) {
    if (deployingAccount) {
      !!showAlert && showAlert(t('currentlyDeploying'));
      return;
    }

    !!setDeployingAccount && setDeployingAccount(true);
    const hash: string = await etherspotService.setBatchDeployAccount(chain, true);
    !!setDeployingAccount && setDeployingAccount(false);

    if (!hash || hash === AccountStates.Deployed || hash === AccountStates.UnDeployed) {
      !!showAlert && showAlert(t('deployError'));
      return;
    }

    sdk?.notifications$
      .pipe(
        map(async (notification) => {
          if (notification?.type === NotificationTypes.GatewayBatchUpdated) {
            const submittedBatch = await sdk.getGatewaySubmittedBatch({
              hash,
            });

            const failedStates = [
              GatewayTransactionStates.Canceling,
              GatewayTransactionStates.Canceled,
              GatewayTransactionStates.Reverted,
            ];

            if (submittedBatch?.transaction?.state && failedStates.includes(submittedBatch?.transaction?.state)) {
              !!showAlert && showAlert(t('deployError'));
            } else if (submittedBatch?.transaction?.state === GatewayTransactionStates.Sent) {
              const signature = await sdk.signMessage({ message });
              base64Hash = Buffer.from(signature.replace('0x', ''), 'hex').toString('base64');

              if (!base64Hash) {
                !!showAlert && showAlert(t('signatureError'));
                return;
              }

              onRampOptions.hash = base64Hash;
              const options = buildUrlOptions(onRampOptions);
              const url = `${getEnv().PELERIN_WIDGET_URL}/${options}`;
              return url;
            }
          }
        }),
      )
      .subscribe();
  } else {
    const signature = await sdk.signMessage({ message });
    base64Hash = Buffer.from(signature.replace('0x', ''), 'hex').toString('base64');
    if (!base64Hash) {
      !!showAlert && showAlert(t('signatureError'));
      return;
    }

    onRampOptions.hash = base64Hash;
    const options = buildUrlOptions(onRampOptions);
    const url = `${getEnv().PELERIN_WIDGET_URL}/${options}`;
    return url;
  }
};
