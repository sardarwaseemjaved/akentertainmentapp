import React, { Component } from 'react';
import { View, StyleSheet, Text, Platform, KeyboardAvoidingView, ImageBackground } from 'react-native';
import { GiftedChat, Bubble, Time } from 'react-native-gifted-chat';
import api from './../../api';
import * as firebase from 'firebase';
import { connect } from 'react-redux';
import { signOutUser, setLocalUserProfile, getLocalUserProfile, getUserProfile } from '../../auth';
import ThemeColors from './../../styles/colors'
import { setMessages, getMessages } from './../../helpers/asyncStorage'
mapStateToProps = (state) => {
  const { auth } = state;
  return { auth }
}

mapDispatchToProps = (dispatch) => {
  return {
    onSignIn: (user) => { dispatch(signIn(user)) }
  }
}
class GlobalChat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
    };
  }
  getLocalMessages = async () => {
    let messages = await getMessages();
    if (messages != null) {
      this.setState({ messages })
    }
  }
  async componentDidMount() { 
    api.loadMessages(async (message) => {
      await this.setState(previousState => ({
        messages: GiftedChat.append(previousState.messages, message),
      })); 
    });
  }

  componentWillUnmount() {
    api.closeChat();
  }
  renderTime = props => {
    return (
      <Time
        {...props}
        textStyle={bubbleStyles.timeTextStyles}
      />
    );
  }
  renderBubble = props => {
    return (
      <View style={[styles.bubbleContainer, {
        marginLeft: props.position == "left" ? 0 : 60,
        marginRight: props.position == "left" ? 60 : 0,
        backgroundColor: props.position == "left" ? ThemeColors.secondaryColorRgba + '0.8)' : ThemeColors.primaryColorRgba + '0.8)',
      }]}
      >
        <Bubble
          {...props}
          textStyle={bubbleStyles.textStyle}
          wrapperStyle={bubbleStyles.wrapperStyle}
        />
      </View>
    )
  }
  render() {
    const { messages } = this.state;
    const { name, userColor } = this.props.auth;
    return (
      <ImageBackground style={styles.container} source={require('./../../../assets/images/loginScreen.jpg')}>
        <GiftedChat
          renderTime={this.renderTime}
          renderBubble={this.renderBubble}
          messages={messages}
          onSend={(message) => api.sendMessage(message)}
          user={{ _id: api.getUid(), name, userColor }}
        />
        {
          Platform.OS === 'android' && <KeyboardAvoidingView behavior="padding" />
        }
      </ImageBackground>
    );
  }
}
const styles = StyleSheet.create({
  ImageBackgroundStyle: {
    flex: 1,
    width: AppConstants.screenWidth,
    height: AppConstants.screenHeight,
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: ThemeColors.backgroundColor,
  },
  bubbleContainer: {
    // flex: 1, 
    borderRadius: 20, overflow: 'hidden',
    paddingHorizontal: 15,
  }
});
const bubbleStyles = {
  textStyle: {
    right: {
      color: 'white', marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0
    },
    left: {
      color: 'white', marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0
    },
  },
  wrapperStyle: {
    right: {
      backgroundColor: 'transparent',
      marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0
    },
    left: {
      backgroundColor: 'transparent', marginLeft: 0,
      marginRight: 0, paddingLeft: 0, paddingRight: 0
    }
  },
  timeTextStyles: {
    right: { color: "white" },
    left: { color: "white" }
  }
}
// export default GlobalChat;

export default connect(mapStateToProps, mapDispatchToProps)(GlobalChat);

