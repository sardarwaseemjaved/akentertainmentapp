import React from 'react'
import { View, StyleSheet } from 'react-native'
import ThemeColors from './../../styles/colors';
export const OverLay = ({ withAbsolutePosition, children, width, height, style }) => {
    return (
        <View
            style={[
                withAbsolutePosition && styles.absolute,
                width && { width: width },
                height && { height: height },
                styles.overlay,
                style,
            ]}>
            {children}
        </View>
    )
}
const styles = StyleSheet.create({
    overlay: {
        backgroundColor: ThemeColors.backgroundColorRgba + '0.8)',
    },
    absolute: {
        position: 'absolute',
        top: 0,
        left: 0,
    }
})