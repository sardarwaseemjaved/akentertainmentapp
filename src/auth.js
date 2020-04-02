import { AsyncStorage } from 'react-native';
import api from './api';
import {onSignIn} from './redux/actions/authActions'


export const USER_KEY = 'chat-a-lot-signed-in';
export const USER_PROFILE_KEY = 'userProfile';

export const setLocalUserProfile = (userProfile) => AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));


export const signInApp = (user) => AsyncStorage.setItem(USER_KEY, 'true');


export const getUserProfile = async () => {
  getLocalUserProfile()
    .then((localUserProfile) => {
      if (localUserProfile) {
        console.log('localUserProfile User:', localUserProfile)
        this.props.onSignIn(localUserProfile)
        this.setState({ isUserProfileLoaded: true })
      }
      else {
        console.log('else')
        api.getCurrentUserExtraData()
          .then(user => {
            if (user) {
              console.log('user',user)
              this.props.onSignIn(user)
              setLocalUserProfile(user)
              this.setState({ isUserProfileLoaded: true })
            }
            else {
              signOutUser(this.props.navigation)
            }
          })
      }
    })
    .catch(e => {
      this.setState({ isUserProfileLoaded: true })
      console.log('getUserProfile Error:', e)
      signOutUser(this.props.navigation)
    })
}

export const signOutApp = async () => {
  let keys = [USER_KEY, USER_PROFILE_KEY];
  await AsyncStorage.multiRemove(keys)
};

export const signOutUser = (navigation) => {
  api.signOutFirebase();
  signOutApp().then(() => navigation.navigate('SignedOutStack'));
}

export const isSignedIn = () => new Promise((resolve, reject) => {
  AsyncStorage.getItem(USER_KEY)
    .then((res) => {
      if (res !== null) {
        try {
          resolve(JSON.parse(res));
        }
        catch (e) {
          console.log(e)
        }
      } else {
        resolve(false);
      }
    })
    .catch(err => reject(err));
});

export const getLocalUserProfile = () => new Promise( async (resolve, reject) => {
  await AsyncStorage.getItem(USER_PROFILE_KEY)
    .then((res) => {
      console.log('getLocalUserProfile res:', res);
      if (res !== null) {
        try {
          resolve(JSON.parse(res));
        }
        catch (e) {
          console.log(e)
        }
      } else {
        resolve(false);
      }
    })
    .catch(err => {
      console.log('getLocalUserProfile catch:', err)
      resolve(false)
    });
});
