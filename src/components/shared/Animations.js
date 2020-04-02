import React from 'react';
import LottieView from "lottie-react-native";

export class LottieAnimation extends React.Component {
    constructor(props) {
        super(props);
    }
    componentDidMount() {
        this.animation.play();
        // Or set a specific startFrame and endFrame with:
        // this.animation.play(30, 120);
    }
    resetAnimation = () => {
        this.animation.reset();
    };
    // componentWillUnmount() {
    //     this.resetAnimation()
    // }
    render() {
        var { style, source } = this.props
        return (
            <LottieView
                ref={animation => {
                    this.animation = animation;
                }}
                style={[{ flex: 1 }, style]}
                source={source ? source : require('./../../assets/animations/2811-record-player.json')}
            />
        );
    }
}

