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

import t from 'translations/translate';

// Actions
import { saveDbAction } from 'actions/dbActions';

// Components
import Toast from 'components/Toast';

// Local
import Storage from 'services/storage';

export async function getNotificationsVisibleStatus() {
  const storage: any = Storage.getInstance('db');
  const status: any = await storage.get('get_notifications8');

  return status?.visible;
}

export async function setNotificationsVisibleStatus(dispatch: any, navigation: any, status: boolean) {
  await dispatch(saveDbAction('get_notifications8', { visible: status }));
  navigation.goBack();
  if (status) {
    Toast.show({
      message: t('notification.notification_enable'),
      emoji: 'white_check_mark',
    });
  }
}
