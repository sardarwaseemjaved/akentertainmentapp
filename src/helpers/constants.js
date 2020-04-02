import { Dimensions, StatusBar } from 'react-native'
export default AppConstants = {
    screenWidth: Dimensions.get('window').width,
    screenHeight: Dimensions.get('window').height,
    statusBarHeight: StatusBar.currentHeight,
}