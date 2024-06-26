import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  Text,
  TextInput
} from 'react-native';
import { connect } from 'react-redux';
import IconTitleSet from './../shared/IconTitleSet';
import Button from './../shared/Button';
import Wrapper from './Wrapper';
import api from '../../api';
import { signOutUser, setLocalUserProfile, getLocalUserProfile } from '../../auth';
import { signIn } from './../../redux'
import { LottieAnimation, Row } from './../shared'
import { Icon } from 'native-base';

mapStateToProps = (state) => {
  const { auth } = state;
  return {
    auth
  }
}

mapDispatchToProps = (dispatch) => {
  return {
    onSignIn: (user) => { dispatch(signIn(user)) }
  }
}
// export default class MainMenu extends Component {
class MainMenu extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isUserProfileLoaded: false
    }
  }
  componentDidCatch(e) {
    console.log('componentDidCatch error', e)
  }
  getUserProfile = async () => {
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
  async componentDidMount() {
    this.getUserProfile()
  }
  static navigationOptions = {
    headerLeft: null,
  };
  render() {
    const { auth } = this.props;
    console.log('auth>>>>>>>>', auth)
    const { isUserProfileLoaded } = this.state;
    if (!isUserProfileLoaded) {
      return <Wrapper isLoading />
    }
    return (
      <Wrapper>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#00796B" />
          {/* <IconTitleSet
            iconName="chat"
            iconSize={100}
            iconColor="#bdede3"
            iconType='m'
            style={styles.iconTitleSet}
          >

            Welcome {auth.name.split(" ")[0].substring(0, 1).toUpperCase() + auth.name.split(" ")[0].substring(1)}
          </IconTitleSet> */}
          <Row style={styles.row} >
            <Icon type='MaterialCommunityIcons' name='brightness-1' style={{ color: auth.userColor, fontSize: 15 }} />
            <Text style={styles.nameText}>
              {auth.name.split(" ")[0].substring(0, 1).toUpperCase() + auth.name.split(" ")[0].substring(1)}
            </Text>
          </Row>
          {/* <View style={{ flex: 1, width: '100%' }}>
            <Text style={styles.welcomeText}>
              Welcome
            </Text>
            <Row style={styles.row} >
              <Icon type='MaterialCommunityIcons' name='brightness-1' style={{ color: auth.userColor, fontSize: 15 }} />
              <Text style={styles.nameText}>
                {auth.name.split(" ")[0].substring(0, 1).toUpperCase() + auth.name.split(" ")[0].substring(1)}
              </Text>
            </Row>
            <LottieAnimation
              style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', alignContent: 'center', alignSelf: 'center' }}
              source={require('./../../assets/animations/7829-chat-button.json')}
            />
          </View> */}
          <Button
            onPress={() => this.props.navigation.navigate('GlobalChat', {
              name: 'waseem',
            })}
            style={styles.button}
          >
            Global chat
          </Button>
          {/* <Button
            onPress={() => this.props.navigation.navigate('UserList')}
            style={styles.button}
          >
            Contacts
          </Button>
          <Button
            onPress={() => this.props.navigation.navigate('ActiveChatList')}
            style={styles.button}
          >
            Conversations
          </Button> */}
          <Button
            onPress={() => this.props.navigation.navigate('videos', { user: auth })}
            style={styles.button}
          >
            Videos
          </Button>
          <Button
            onPress={() => signOutUser(this.props.navigation)}
            style={styles.button}
          >
            Sign out
          </Button>
        </View>
      </Wrapper>
    );
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(MainMenu);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
  },
  iconTitleSet: {
    marginBottom: 20,
  },
  button: {
    marginBottom: 10,
  },
  welcomeText: { color: 'white', fontSize: 20, textAlign: 'center', flex: 1, },
  nameText: { color: 'white', fontSize: 20, paddingHorizontal: 5 },
  row: {
    justifyContent: 'center', alignItems: 'center'
  }
});




