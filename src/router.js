import React from 'react';
import { Button } from 'react-native';
import {
  createSwitchNavigator,
  createAppContainer,
  // StackNavigator,
  // SwitchNavigator,
} from 'react-navigation';
import {
  createStackNavigator,
} from 'react-navigation-stack';


import ThemeColors from './styles/colors'
import api from './api';
import { showMessage } from 'react-native-flash-message';

import Login from './components/screens/Login';
import MainMenu from './components/screens/MainMenu';
import UserList from './components/screens/UserList';
import ActiveChatList from './components/screens/ActiveChatList';
import Chat from './components/screens/Chat';
import GlobalChat from './components/screens/GlobalChat';
import ResetPassword from './components/screens/ResetPassword';
import Register from './components/screens/Register';
import BackButton from './components/shared/BackButton';
import { signOutApp } from './auth';
import VideosList from './components/screens/VideosList';
import { createBottomTabNavigator, BottomTabBar } from 'react-navigation-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Icon } from 'native-base'
// Authorization flow created with help from:
// https://medium.com/the-react-native-log/building-an-authentication-flow-with-react-navigation-fb5de2203b5c


const TabBarComponent = props => <BottomTabBar {...props} />;

const TabScreens = createBottomTabNavigator(
  {
    mainMenu: MainMenu,
    videos: VideosList,
    GlobalChat: GlobalChat,
  },
  {
    defaultNavigationOptions: ({ navigation }) => ({
      tabBarIcon: ({ focused, horizontal, tintColor }) => {
        let iconType, iconFontSize;
        const { routeName } = navigation.state;
        let IconComponent = Ionicons;
        let iconName;
        if (routeName === 'mainMenu') {
          iconName = `menu`;
          // iconName = `ios-home${focused ? '' : ''}`;
          // iconName = `ios-information-circle${focused ? '' : '-outline'}`; 
          // IconComponent = HomeIconWithBadge;
        }
        else if (routeName === 'videos') {
          iconType = 'Foundation'
          iconName = `play-video`;
          iconFontSize = 28
          // iconName = `ios-videocam${focused ? '' : ''}`;
          // iconName = `ios-information-circle${focused ? '' : '-outline'}`; 
          // IconComponent = HomeIconWithBadge;
        } else if (routeName === 'GlobalChat') {
          iconType = 'MaterialCommunityIcons'
          iconName = `message-outline`;
        }

        // You can return any component that you like here!
        // return <IconComponent name={iconName} size={35} color={tintColor} />;
        return <Icon type={iconType} name={iconName} size={35} color={tintColor} style={{ color: tintColor, fontSize: iconFontSize || 25 }} />;
      },
    }),
    tabBarOptions: {
      activeTintColor: ThemeColors.primaryColor,
      inactiveTintColor: ThemeColors.primaryColorRgba + '0.6)',
      showLabel: false,
      style: { backgroundColor: ThemeColors.secondaryColor, borderTopWidth: 0, elevation: 1 }
      // style: { backgroundColor: ThemeColors.secondaryColorRgba + '0.8)', borderTopWidth: 0 }
    },
  }
);

// const TabScreens = createBottomTabNavigator(
//   {
//     videos: {
//       screen: VideosList,
//       navigationOptions: {
//         title: 'Videos',
//       },
//     },
//     GlobalChat: {
//       screen: GlobalChat,
//       navigationOptions: {
//         title: 'Global Chat',
//       }, 
//     },
//   },
//   {
//     tabBarComponent: props => (
//       <TabBarComponent {...props} style={{ borderTopColor: '#605F60' }} />
//     ),
//   }
// );

export const SignedOutStack = createStackNavigator(
  {
    Login: {
      screen: Login,
      navigationOptions: {
        title: 'Login',
      },
    },
    Register: {
      screen: Register,
      navigationOptions: {
        title: 'Join',
      },
    },
    ResetPassword: {
      screen: ResetPassword,
      navigationOptions: {
        title: 'Reset Password',
      },
    },
  },
  {
    navigationOptions: ({ navigation }) => ({
      headerStyle: {
        backgroundColor: '#ffffff',
        elevation: null,
      },
      headerTintColor: '#16a085',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }),
  },
);

export const SignedInStack = createStackNavigator(
  {
    MainMenu: {
      screen: MainMenu,
      navigationOptions: {
        title: 'Menu',
      },
    },
    GlobalChat: {
      screen: GlobalChat,
      navigationOptions: {
        title: 'Global Chat',
      },
    },
    UserList: {
      screen: UserList,
      navigationOptions: {
        title: 'Contacts',
      },
    },
    ActiveChatList: {
      screen: ActiveChatList,
      navigationOptions: {
        title: 'Conversations',
      },
    },
    Chat: {
      screen: Chat,
      navigationOptions: {
        title: 'Chat',
      },
    },
    videos: {
      screen: VideosList,
      navigationOptions: {
        title: 'Videos',
      },
    },
  },
  {
    navigationOptions: ({ navigation }) => ({
      headerStyle: {
        backgroundColor: '#ffffff',
        elevation: null,
        paddingLeft: 10,
        paddingRight: 10,
      },
      headerTintColor: '#16a085',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      headerLeft: <BackButton navigation={navigation} />,
      headerRight: (
        <Button
          primary
          title="Logout"
          color="#16a085"
          onPress={() => {
            api.signOutFirebase()
              .then(
                () => {
                  signOutApp().then(() => navigation.navigate('SignedOutStack', {
                    messageProps: {
                      title: 'Bye-Bye',
                      body: 'Talk to you later!',
                      type: 'warning',
                    },
                  }));
                },
                (error) => {
                  showMessage({
                    message: 'Uh-oh',
                    description: `${error.message} (${error.code})`,
                    type: 'danger',
                  });
                },
              );
          }}
        >
          Log out
        </Button>
      ),
    }),
  },
);

export const createRootNavigator = (signedIn = false) => createSwitchNavigator(
  {
    SignedInStack: {
      screen: TabScreens,
      // screen: SignedInStack,
    },
    SignedOutStack: {
      screen: SignedOutStack,
    },
  },
  {
    initialRouteName: signedIn ? 'SignedInStack' : 'SignedOutStack',
  },
);
export const AppContainer = (signedIn) => createAppContainer(createRootNavigator(signedIn));
