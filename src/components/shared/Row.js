import React from 'react';
import { View, StyleSheet } from 'react-native';
export const Row = (props) => {
    return (
        <View style={[styles.row, props.style]}>
            {props.children}
        </View>
    )
}
const styles = StyleSheet.create({
    row: { flexDirection: 'row' },
})