import React from 'react'
import { Image, View, TouchableOpacity } from 'react-native'
import { Icon } from "native-base";
import ThemeColors from './../../styles/colors';
export const AppIcon = ({ onPress, name, color, size = 20, containerStyles }) => (
    <TouchableOpacity disabled={!onPress} onPress={onPress} style={containerStyles}>
        <Icon
            type='MaterialCommunityIcons' name={name}
            style={{ color: color || ThemeColors.primaryColor, fontSize: size }}
        />
    </TouchableOpacity>
)

export const AppImageIcon = ({ source, color, size = 20, containerStyles, width, height }) => (
    <View style={containerStyles}>
        <Image
            source={source}
            style={[{ width: width || size, height: height || size }, color && { tintColor: color }]}
        />
    </View>
)
