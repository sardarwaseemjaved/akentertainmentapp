import { Dimensions, PixelRatio, StatusBar, Platform } from 'react-native';
export const IS_PLATFORM_IOS = Platform.OS == 'ios';
export const WINDOW_WIDTH = Dimensions.get('window').width;
export const WINDOW_HEIGHT = Dimensions.get('window').height;
import Constants from 'expo-constants';
export const STATUSBAR_HEIGHT = Constants.statusBarHeight;

const guidelineBaseWidth = 360;
const guidelineBaseHeight = 640;

// export const  = perc => (perc * WINDOW_WIDTH) / 100;
export const widthPerc = perc => (perc * WINDOW_WIDTH) / 100;
export const heightPerc = perc => (perc * WINDOW_HEIGHT) / 100;
export const scaleSize = size => (WINDOW_WIDTH / guidelineBaseWidth) * size;
export const scaleHeight = size => (WINDOW_HEIGHT / guidelineBaseHeight) * size;
export const appFontScale = size => Math.round((size * WINDOW_WIDTH) / guidelineBaseWidth );
// export const scaleFont = size => size * PixelRatio.getFontScale();

function dimensions(top, right = top, bottom = top, left = right, property) {
    let styles = {};

    styles[`${property}Top`] = top;
    styles[`${property}Right`] = right;
    styles[`${property}Bottom`] = bottom;
    styles[`${property}Left`] = left;

    return styles;
}

export function margin(top, right, bottom, left) {
    return dimensions(top, right, bottom, left, 'margin');
}

export function padding(top, right, bottom, left) {
    return dimensions(top, right, bottom, left, 'padding');
}

export function boxShadow(color, offset = { height: 2, width: 2 },
    radius = 8, opacity = 0.2) {
    return {
        shadowColor: color,
        shadowOffset: offset,
        shadowOpacity: opacity,
        shadowRadius: radius,
        elevation: radius,
    };
}