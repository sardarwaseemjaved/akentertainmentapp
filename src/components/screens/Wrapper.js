import React from 'react';
import {
  View, StatusBar, StyleSheet, ScrollView,
  Keyboard, Dimensions, KeyboardAvoidingView, ImageBackground, Image
} from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import ThemeColors from './../../styles/colors'
import AppConstants from './../../helpers/constants'
import { Content } from 'native-base';
export default Wrapper = (props) => {
  const { style = {}, children, isLoading = false, contentContainerStyle = {} } = props;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" >
      <ScrollView contentContainerStyle={contentContainerStyle} style={[styles.container, style]}>
        <StatusBar barStyle="dark-content" backgroundColor="#16a085" />
        {children}
        <Spinner visible={isLoading} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
export const AuthWrapper = (props) => {
  const { style = {}, children, isLoading = false, contentContainerStyle = {} } = props;
  return (
    <View style={styles.ImageBackgroundStyle}>
      <StatusBar barStyle="light-content" backgroundColor="#16a085" />
      <ImageBackground style={styles.ImageBackgroundStyle} source={require('./../../../assets/images/loginScreen.jpg')}>
        <Content keyboardShouldPersistTaps='never' enableOnAndroid showsVerticalScrollIndicator={false}>
          {/* <KeyboardAvoidingView behavior="padding">
          <ScrollView showsVerticalScrollIndicator={false}> */}
          <View style={styles.emptyView} />
          <View style={styles.content}>
            {/* <ImageBackground style={styles.header} source={require('./../../../assets/images/splash.png')}>
              </ImageBackground> */}
            <View style={styles.header}>
              <Image
                style={styles.logoImage} source={require('./../../../assets/images/akLogo.png')} />
            </View>
            {children}
          </View>
          <View style={styles.emptyView} />
          {/* </ScrollView>
        </KeyboardAvoidingView> */}
        </Content>
      </ImageBackground>
      <Spinner visible={isLoading} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: ThemeColors.backgroundColor,
  },
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
    // resizeMode: 'center'
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 60, overflow: 'hidden'
  },
  logoImage: {
    resizeMode: 'contain',
    height: (AppConstants.screenHeight / 3) - 70,
  },
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
  },
  icon: {
    paddingHorizontal: 10,
  },
  submitButtonContainer: {
    marginTop: 15
  },
  submitButton: {
    width: AppConstants.screenWidth - 30,
    borderRadius: 60,
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
}); 
