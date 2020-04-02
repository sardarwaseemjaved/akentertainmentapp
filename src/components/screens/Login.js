import React, { Component } from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  View,
  ImageBackground,
  ScrollView,
  StatusBar,
  Text,
  TextInput
} from 'react-native';
import { Container,Icon } from 'native-base'
import { showMessage } from 'react-native-flash-message';
import Button from './..//shared/Button';
// import TextInput from './../shared/TextInput';
import IconTitleSet from './../shared/IconTitleSet';
import validateForm from './../../helpers/validation';
import Wrapper, { AuthWrapper } from './Wrapper';
import { get } from 'lodash';
// import { Icon } from 'react-native-elements';
import firebase from './../../lib/firebase';
import { signInApp } from '../../auth';
import ThemeColors from './../../styles/colors'
import AppConstants from './../../helpers/constants'

export default class Login extends Component {
  static navigationOptions = {
    header: null,
  };

  state = {
    email: '',
    password: '',
    isLoading: false,
  };

  componentDidMount() {
    const messageProps = get(this.props, 'navigation.state.params.messageProps');
    if (messageProps) {
      const { title, body, type } = messageProps;

      showMessage({
        message: title,
        description: body,
        type,
      });
    }
  }

  runValidation = () => {
    const { email, password } = this.state;

    const fields = [
      {
        value: email,
        verify: [
          {
            type: 'isPopulated',
            message: 'Please enter your email address',
          },
          {
            type: 'isEmail',
            message: 'Please format your email address correctly',
          },
        ],
      },
      {
        value: password,
        verify: [
          {
            type: 'isPopulated',
            message: 'Please enter your password',
          },
        ],
      },
    ];

    const errorMessage = validateForm(fields);
    if (errorMessage) {
      showMessage({
        message: 'Check your form',
        description: errorMessage,
        type: 'danger',
      });

      return false;
    }

    return true;
  }

  onLoginPress = () => {
    const { email, password } = this.state;

    const isFormValid = this.runValidation();
    if (!isFormValid) {
      return;
    }

    this.setState({ isLoading: true });

    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then((user) => {
        this.setState({ isLoading: false });
        signInApp().then(() => this.props.navigation.navigate('SignedInStack'));
      })
      .catch((error) => {
        showMessage({
          message: 'Check your form',
          description: `${error.message} (${error.code})`,
          type: 'danger',
        });
        this.setState({
          isLoading: false,
        });
      });
  }

  render() {
    return (
      <Container>
        <AuthWrapper isLoading={this.state.isLoading}>
          <View style={{ width: '100%', paddingHorizontal: 30 }}>
            <Text style={styles.pageHeading}>LOGIN</Text>
          </View>
          <View style={[styles.textInputContainer]}>
            <Icon style={styles.icon} name='ios-mail' />
            <TextInput
              style={styles.textinput}
              placeholder="Email Address"
              keyboardType="email-address"
              value={this.state.email}
              blurOnSubmit={false}
              onSubmitEditing={() => this.passwordInput.focus()}
              onChangeText={email => this.setState({ email })}
            />
          </View>

          <View style={[styles.textInputContainer]}>
            <Icon style={styles.icon} name='lock' />
            <TextInput
              style={styles.textinput}
              placeholder="Password"
              returnKeyType="go"
              secureTextEntry
              value={this.state.password}
              ref={(input) => { this.passwordInput = input; }}
              onChangeText={password => this.setState({ password })}
            />
          </View>

          <View style={styles.submitButtonContainer}>
            <Button style={styles.submitButton} onPress={this.onLoginPress}>SUBMIT</Button>
          </View>

          <View style={styles.linksContainer}>
            <Button onPress={() => this.props.navigation.navigate('Register')} textStyle={styles.linksText} style={styles.links} >
              Register
                  </Button>
            <Button onPress={() => this.props.navigation.navigate('ResetPassword')} textStyle={styles.linksText} style={styles.links}>
              Reset Password
                  </Button>
          </View>

        </AuthWrapper>


      </Container>
    )
  }
}
const styles = StyleSheet.create({
  ImageBackgroundStyle: {
    flex: 1,
    width: AppConstants.screenWidth,
    height: AppConstants.screenHeight,
    alignItems: 'center',
  },
  emptyView: { height: 30 },
  header: {
    backgroundColor: ThemeColors.primaryColor,
    width: AppConstants.screenWidth - 30,
    height: AppConstants.screenHeight / 3,
    resizeMode: 'center',
    borderRadius: 60, overflow: 'hidden'
  },
  pageHeading:{ color: 'white', marginTop: 15, fontSize: 20, fontWeight: 'bold', textAlign:'center' },
  content: {
    // marginTop: 50,
    borderRadius: 60, overflow: 'hidden',
    backgroundColor: ThemeColors.secondaryColorRgba + '0.5)',
    alignItems: 'center',
    paddingBottom: 50
  },

  textInputContainer: {
    marginTop: 15,
    width: AppConstants.screenWidth - 60,
    height: 40,
    borderRadius: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15
  },
  textinput: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 5,
  },
  icon: {
    paddingHorizontal: 10,
    fontSize: 20,
    width: 30
  },
  submitButtonContainer: {
    marginTop: 15,
  },
  submitButton: {
    width: AppConstants.screenWidth - 60,
    borderRadius: 60,
    height: 40, 
    padding: 0,
    justifyContent:'center',
    backgroundColor: ThemeColors.secondaryColor
  },
  linksContainer: {
    marginTop: 15
  },
  links: {
    backgroundColor: 'transparent',
    padding: 5
  },
  linksText: {
    color: ThemeColors.primaryColor,
  }
})




{/* <View style={styles.container}>
          <IconTitleSet
            iconName="chat"
            iconSize={100}
            iconColor="#bdede3"
            style={styles.iconTitleSet}
          >
            Chat-a-lot
          </IconTitleSet>
          <KeyboardAvoidingView style={styles.loginformContainer}>
            <TextInput
              placeholder="Email Address"
              onSubmitEditing={() => this.passwordInput.focus()}
              keyboardType="email-address"
              value={this.state.email}
              onChangeText={email => this.setState({ email })}
            />
            <TextInput
              placeholder="Password"
              returnKeyType="go"
              secureTextEntry
              ref={(input) => { this.passwordInput = input; }}
              value={this.state.password}
              onChangeText={password => this.setState({ password })}
            />
            <Button onPress={this.onLoginPress}>LOGIN</Button>
          </KeyboardAvoidingView>
          <Button
            onPress={() => this.props.navigation.navigate('Register')}
            style={styles.signUpButton}
          >
            Sign up
          </Button>
          <Button onPress={() => this.props.navigation.navigate('ResetPassword')}>Reset Password</Button>
        </View>
      </Wrapper>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  iconTitleSet: {
    marginBottom: 20,
  },
  loginformContainer: {
    flex: 1,
    alignSelf: 'stretch',
  },
  signUpButton: {
    marginBottom: 10,
  },
}); */}
