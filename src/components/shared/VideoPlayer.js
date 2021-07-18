import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, Text, TouchableOpacity, TouchableWithoutFeedback, View, ActivityIndicator, StyleSheet, Slider, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { __rest } from "tslib";
import { Audio, Video } from 'expo-av';
import { useNetInfo } from '@react-native-community/netinfo';
import { withDefaultProps } from 'with-default-props';
// import Slider from '@react-native-community/slider';
import ThemeColors from './../../styles/colors';
import CustomSlider from './Slider'
// eslint-disable-next-line @typescript-eslint/no-unused-vars


const ICON_COLOR = ThemeColors.primaryColor;
const CENTER_ICON_SIZE = 36;
const BOTTOM_BAR_ICON_SIZE = 30;
const style = StyleSheet.create({
    iconStyle: {
        textAlign: 'center',
    },
});

export const PlayIcon = () => (<Image style={{ width: CENTER_ICON_SIZE, height: CENTER_ICON_SIZE, alignSelf: 'center' }} source={require('../../../assets/videoIcons/play.png')} />);
export const PauseIcon = () => (<Image style={{ width: CENTER_ICON_SIZE, height: CENTER_ICON_SIZE, alignSelf: 'center' }} source={require('../../../assets/videoIcons/pause.png')} />);
// export const PlayIcon = () => (<MaterialIcons name='play-arrow' size={CENTER_ICON_SIZE} color={ICON_COLOR} style={style.iconStyle} />);
// export const PauseIcon = () => (<MaterialIcons name='pause' size={CENTER_ICON_SIZE} color={ICON_COLOR} style={style.iconStyle} />);
export const Spinner = () => <ActivityIndicator color={ICON_COLOR} size='large' />;
export const FullscreenEnterIcon = () => (<MaterialIcons name='fullscreen' size={BOTTOM_BAR_ICON_SIZE} color={ICON_COLOR} style={style.iconStyle} />);
export const FullscreenExitIcon = () => (<MaterialIcons name='fullscreen-exit' size={BOTTOM_BAR_ICON_SIZE} color={ICON_COLOR} style={style.iconStyle} />);
export const ReplayIcon = () => (<MaterialIcons name='replay' size={CENTER_ICON_SIZE} color={ICON_COLOR} style={style.iconStyle} />);



const SLIDER_COLOR = '#009485';
const BUFFERING_SHOW_DELAY = 200;
// UI states
var ControlStates;
(function (ControlStates) {
    ControlStates["Shown"] = "Show";
    ControlStates["Showing"] = "Showing";
    ControlStates["Hidden"] = "Hidden";
    ControlStates["Hiding"] = "Hiding";
})(ControlStates || (ControlStates = {}));
var PlaybackStates;
(function (PlaybackStates) {
    PlaybackStates["Loading"] = "Loading";
    PlaybackStates["Playing"] = "Playing";
    PlaybackStates["Paused"] = "Paused";
    PlaybackStates["Buffering"] = "Buffering";
    PlaybackStates["Error"] = "Error";
    PlaybackStates["Ended"] = "Ended";
})(PlaybackStates || (PlaybackStates = {}));
var SeekStates;
(function (SeekStates) {
    SeekStates["NotSeeking"] = "NotSeeking";
    SeekStates["Seeking"] = "Seeking";
    SeekStates["Seeked"] = "Seeked";
})(SeekStates || (SeekStates = {}));
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["Fatal"] = "Fatal";
    ErrorSeverity["NonFatal"] = "NonFatal";
})(ErrorSeverity || (ErrorSeverity = {}));
const defaultProps = {
    videoRef: null,
    children: null,
    debug: false,
    inFullscreen: false,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    // Animations
    fadeInDuration: 200,
    fadeOutDuration: 1000,
    quickFadeOutDuration: 200,
    hideControlsTimerDuration: 4000,
    // Icons
    playIcon: PlayIcon,
    replayIcon: ReplayIcon,
    pauseIcon: PauseIcon,
    spinner: Spinner,
    fullscreenEnterIcon: FullscreenEnterIcon,
    fullscreenExitIcon: FullscreenExitIcon,
    // Appearance
    showFullscreenButton: true,
    thumbImage: null,
    iosTrackImage: null,
    textStyle: {
        color: '#FFF',
        fontSize: 12,
    },
    videoBackground: '#000',
    // Callbacks
    errorCallback: (error) => console.error('Error: ', error.message, error.type, error.obj),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    playbackCallback: (callback) => { },
    switchToLandscape: () => console.warn(`Pass your logic to 'switchToLandscape' prop`),
    switchToPortrait: () => console.warn(`Pass your logic to 'switchToPortrait' prop`),
    showControlsOnLoad: false,
    sliderColor: SLIDER_COLOR,
    disableSlider: false,
};
const VideoPlayer = (props) => {
    let playbackInstance = null;
    let showingAnimation = null;
    let hideAnimation = null;
    let shouldPlayAtEndOfSeek = false;
    let controlsTimer = null;
    const { isConnected } = useNetInfo();
    const [playbackState, setPlaybackState] = useState(PlaybackStates.Loading);
    const [lastPlaybackStateUpdate, setLastPlaybackStateUpdate] = useState(Date.now());
    const [seekState, setSeekState] = useState(SeekStates.NotSeeking);
    const [playbackInstancePosition, setPlaybackInstancePosition] = useState(0);
    const [playbackInstanceDuration, setPlaybackInstanceDuration] = useState(0);
    const [shouldPlay, setShouldPlay] = useState(false);
    const [error, setError] = useState('');
    const [sliderWidth, setSliderWidth] = useState(0);
    const [controlsState, setControlsState] = useState(props.showControlsOnLoad ? ControlStates.Shown : ControlStates.Hidden);
    const [controlsOpacity] = useState(new Animated.Value(props.showControlsOnLoad ? 1 : 0));
    // Set audio mode to play even in silent mode (like the YouTube app)
    const setAudio = async () => {
        const { errorCallback } = props;
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
                playThroughEarpieceAndroid: false,
                staysActiveInBackground: false,
            });
        }
        catch (e) {
            errorCallback({
                type: ErrorSeverity.NonFatal,
                message: 'setAudioModeAsync error',
                obj: e,
            });
        }
    };
    useEffect(() => {
        const { videoProps } = props;
        if (videoProps.source === null) {
            console.error('`Source` is a required property');
            throw new Error('`Source` is required');
        }
        setAudio();
    });
    // Handle events during playback
    const updatePlaybackState = (newPlaybackState) => {
        if (playbackState !== newPlaybackState) {
            const { debug } = props;
            debug &&
                console.info('[playback]', playbackState, ' -> ', newPlaybackState, ' [seek] ', seekState, ' [shouldPlay] ', shouldPlay);
            setPlaybackState(newPlaybackState);
            setLastPlaybackStateUpdate(Date.now());
        }
    };
    const updateSeekState = (newSeekState) => {
        const { debug } = props;
        debug &&
            console.info('[seek]', seekState, ' -> ', newSeekState, ' [playback] ', playbackState, ' [shouldPlay] ', shouldPlay);
        setSeekState(newSeekState);
        // Don't keep the controls timer running when the state is seeking
        if (newSeekState === SeekStates.Seeking) {
            controlsTimer && clearTimeout(controlsTimer);
        }
        else {
            // Start the controlFs timer anew
            resetControlsTimer();
        }
    };
    const updatePlaybackCallback = (status) => {
        const { errorCallback, playbackCallback } = props;
        try {
            playbackCallback(status);
        }
        catch (e) {
            console.error('Uncaught error when calling props.playbackCallback', e);
        }
        if (!status.isLoaded) {
            if (status.error) {
                updatePlaybackState(PlaybackStates.Error);
                const errorMsg = `Encountered a fatal error during playback: ${status.error}`;
                setError(errorMsg);
                errorCallback({ type: ErrorSeverity.Fatal, message: errorMsg, obj: {} });
            }
        }
        else {
            // Update current position, duration, and `shouldPlay`
            setPlaybackInstancePosition(status.positionMillis || 0);
            setPlaybackInstanceDuration(status.durationMillis || 0);
            setShouldPlay(status.shouldPlay);
            // Figure out what state should be next (only if we are not seeking,
            // other the seek action handlers control the playback state, not this callback)
            if (seekState === SeekStates.NotSeeking && playbackState !== PlaybackStates.Ended) {
                if (status.didJustFinish && !status.isLooping) {
                    updatePlaybackState(PlaybackStates.Ended);
                }
                else {
                    // If the video is buffering but there is no Internet, you go to the Error state
                    if (!isConnected && status.isBuffering) {
                        updatePlaybackState(PlaybackStates.Error);
                        setError('You are probably offline.' +
                            'Please make sure you are connected to the Internet to watch this video');
                    }
                    else {
                        updatePlaybackState(isPlayingOrBufferingOrPaused(status));
                    }
                }
            }
        }
    };
    // Seeking
    const getSeekSliderPosition = () => playbackInstancePosition / playbackInstanceDuration || 0;
    const onSeekSliderValueChange = async () => {
        if (playbackInstance !== null && seekState !== SeekStates.Seeking) {
            updateSeekState(SeekStates.Seeking);
            // A seek might have finished (Seeked) but since we are not in NotSeeking yet, the `shouldPlay` flag is still false,
            // but we really want it be the stored value from before the previous seek
            shouldPlayAtEndOfSeek = seekState === SeekStates.Seeked ? shouldPlayAtEndOfSeek : shouldPlay;
            // Pause the video
            await playbackInstance.setStatusAsync({ shouldPlay: false });
        }
    };
    const onSeekSliderSlidingComplete = async (value) => {
        if (playbackInstance !== null) {
            const { debug } = props;
            // Seeking is done, so go to Seeked, and set playbackState to Buffering
            updateSeekState(SeekStates.Seeked);
            // If the video is going to play after seek, the user expects a spinner.
            // Otherwise, the user expects the play button
            updatePlaybackState(shouldPlayAtEndOfSeek ? PlaybackStates.Buffering : PlaybackStates.Paused);
            try {
                const playback = await playbackInstance.setStatusAsync({
                    positionMillis: value * playbackInstanceDuration,
                    shouldPlay: shouldPlayAtEndOfSeek,
                });
                // The underlying <Video> has successfully updated playback position
                // TODO: If `shouldPlayAtEndOfSeek` is false, should we still set the playbackState to Paused?
                // But because we setStatusAsync(shouldPlay: false), so the AVPlaybackStatus return value will be Paused.
                updateSeekState(SeekStates.NotSeeking);
                updatePlaybackState(isPlayingOrBufferingOrPaused(playback));
            }
            catch (e) {
                debug && console.error('Seek error: ', e);
            }
        }
    };
    const isPlayingOrBufferingOrPaused = (status) => {
        if (!status.isLoaded) {
            return PlaybackStates.Error;
        }
        if (status.isPlaying) {
            return PlaybackStates.Playing;
        }
        if (status.isBuffering) {
            return PlaybackStates.Buffering;
        }
        return PlaybackStates.Paused;
    };
    const onSeekBarTap = (e) => {
        if (!(playbackState === PlaybackStates.Loading ||
            playbackState === PlaybackStates.Ended ||
            playbackState === PlaybackStates.Error ||
            controlsState !== ControlStates.Shown)) {
            const value = e.nativeEvent.locationX / sliderWidth;
            onSeekSliderValueChange();
            onSeekSliderSlidingComplete(value);
        }
    };
    // Capture the width of the seekbar slider for use in `_onSeekbarTap`
    const onSliderLayout = (e) => {
        setSliderWidth(e.nativeEvent.layout.width);
    };
    // Controls view
    const getMMSSFromMillis = (millis) => {
        const totalSeconds = millis / 1000;
        const seconds = String(Math.floor(totalSeconds % 60));
        const minutes = String(Math.floor(totalSeconds / 60));
        return minutes.padStart(2, '0') + ':' + seconds.padStart(2, '0');
    };
    // Controls Behavior
    const replay = async () => {
        if (playbackInstance !== null) {
            await playbackInstance.setStatusAsync({
                shouldPlay: true,
                positionMillis: 0,
            });
            // Update playbackState to get out of Ended state
            setPlaybackState(PlaybackStates.Playing);
        }
    };
    const togglePlay = async () => {
        if (controlsState === ControlStates.Hidden) {
            return;
        }
        const shouldPlay = playbackState !== PlaybackStates.Playing;
        if (playbackInstance !== null) {
            await playbackInstance.setStatusAsync({ shouldPlay });
        }
    };
    const toggleControls = () => {
        switch (controlsState) {
            case ControlStates.Shown:
                // If the controls are currently Shown, a tap should hide controls quickly
                setControlsState(ControlStates.Hiding);
                hideControls(true);
                break;
            case ControlStates.Hidden:
                // If the controls are currently, show controls with fade-in animation
                showControls();
                setControlsState(ControlStates.Showing);
                break;
            case ControlStates.Hiding:
                // If controls are fading out, a tap should reverse, and show controls
                setControlsState(ControlStates.Showing);
                showControls();
                break;
            case ControlStates.Showing:
                // A tap when the controls are fading in should do nothing
                break;
        }
    };
    const showControls = () => {
        const { fadeInDuration } = props;
        showingAnimation = Animated.timing(controlsOpacity, {
            toValue: 1,
            duration: fadeInDuration,
            useNativeDriver: true,
        });
        showingAnimation.start(({ finished }) => {
            if (finished) {
                setControlsState(ControlStates.Shown);
                resetControlsTimer();
            }
        });
    };
    const hideControls = (immediately = false) => {
        const { quickFadeOutDuration, fadeOutDuration } = props;
        if (controlsTimer) {
            clearTimeout(controlsTimer);
        }
        hideAnimation = Animated.timing(controlsOpacity, {
            toValue: 0,
            duration: immediately ? quickFadeOutDuration : fadeOutDuration,
            useNativeDriver: true,
        });
        hideAnimation.start(({ finished }) => {
            if (finished) {
                setControlsState(ControlStates.Hidden);
            }
        });
    };
    const onTimerDone = () => {
        // After the controls timer runs out, fade away the controls slowly
        setControlsState(ControlStates.Hiding);
        hideControls();
    };
    const resetControlsTimer = () => {
        const { hideControlsTimerDuration } = props;
        if (controlsTimer) {
            clearTimeout(controlsTimer);
        }
        controlsTimer = setTimeout(() => onTimerDone(), hideControlsTimerDuration);
    };
    const { playIcon: VideoPlayIcon, pauseIcon: VideoPauseIcon, spinner: VideoSpinner, fullscreenEnterIcon: VideoFullscreenEnterIcon, fullscreenExitIcon: VideoFullscreenExitIcon, replayIcon: VideoReplayIcon, switchToLandscape, switchToPortrait, inFullscreen, sliderColor, disableSlider, thumbImage, iosTrackImage, showFullscreenButton, textStyle, videoProps, videoBackground, width, height, } = props;
    const centeredContentWidth = 60;
    const screenRatio = width / height;
    let videoHeight = height;
    let videoWidth = videoHeight * screenRatio;
    if (videoWidth > width) {
        videoWidth = width;
        videoHeight = videoWidth / screenRatio;
    }
    // Do not let the user override `ref`, `callback`, and `style`
    // @ts-ignore
    const { videoRef, ref, style, onPlaybackStatusUpdate, source } = videoProps, otherVideoProps = __rest(videoProps, ["videoRef", "ref", "style", "onPlaybackStatusUpdate", "source"]);
    const Control = (_a) => {
        var { callback, center, children, transparent = false } = _a, otherProps = __rest(_a, ["callback", "center", "children", "transparent"]);
        return (<TouchableOpacity {...otherProps} hitSlop={{ top: 20, left: 20, bottom: 20, right: 20 }} onPress={() => {
            resetControlsTimer();
            callback();
        }}>
            <View style={center && {
                backgroundColor: transparent ? 'transparent' : 'rgba(0, 0, 0, 0.4)',
                justifyContent: 'center',
                width: centeredContentWidth,
                height: centeredContentWidth,
                borderRadius: centeredContentWidth,
            }}>
                {children}
            </View>
        </TouchableOpacity>);
    };
    const CenteredView = (_a) => {
        var { children, style: viewStyle } = _a,
            // pointerEvents,
            otherProps = __rest(_a, ["children", "style"]);
        return (<Animated.View {...otherProps} style={[
            {
                position: 'absolute',
                left: (videoWidth - centeredContentWidth) / 2,
                top: (videoHeight - centeredContentWidth) / 2,
                width: centeredContentWidth,
                height: centeredContentWidth,
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
            },
            viewStyle,
        ]}>
            {children}
        </Animated.View>);
    };
    const ErrorText = ({ text }) => (<View style={{
        position: 'absolute',
        top: videoHeight / 2,
        width: videoWidth - 40,
        marginRight: 20,
        marginLeft: 20,
    }}>
        <Text style={[textStyle, { textAlign: 'center' }]}>{text}</Text>
    </View>);
    return (<TouchableWithoutFeedback onPress={toggleControls}>
        <View style={{ backgroundColor: videoBackground }}>
            <Video source={source} ref={component => {
                playbackInstance = component;
                ref && ref(component);
                videoRef && videoRef(component);
            }} onPlaybackStatusUpdate={updatePlaybackCallback} style={{
                width: videoWidth,
                height: videoHeight,
            }} {...otherVideoProps} />



            {((playbackState === PlaybackStates.Buffering &&
                Date.now() - lastPlaybackStateUpdate > BUFFERING_SHOW_DELAY) ||
                playbackState === PlaybackStates.Loading) && (<View style={{
                    position: 'absolute',
                    left: (videoWidth - centeredContentWidth) / 2,
                    top: (videoHeight - centeredContentWidth) / 2,
                    width: centeredContentWidth,
                    height: centeredContentWidth,
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    {
                        // @ts-ignore
                        <VideoSpinner />}
                </View>)}


            {seekState !== SeekStates.Seeking &&
                (playbackState === PlaybackStates.Playing || playbackState === PlaybackStates.Paused) && (<CenteredView pointerEvents={controlsState === ControlStates.Hidden ? 'none' : 'auto'}
                    // @ts-ignore
                    style={{ opacity: controlsOpacity }}>
                    <Control center={true} callback={togglePlay}>

                        {
                            // @ts-ignore
                            playbackState === PlaybackStates.Playing && <VideoPauseIcon />}
                        {
                            // @ts-ignore
                            playbackState === PlaybackStates.Paused && <VideoPlayIcon />}
                    </Control>
                </CenteredView>)}


            {playbackState === PlaybackStates.Ended && (<CenteredView>
                <Control center={true} callback={replay}>
                    {
                        // @ts-ignore
                        <VideoReplayIcon />}
                </Control>
            </CenteredView>)}


            {playbackState === PlaybackStates.Error && <ErrorText text={error} />}


            <Animated.View pointerEvents={controlsState === ControlStates.Hidden ? 'none' : 'auto'} style={{
                position: 'absolute',
                bottom: 0,
                width: videoWidth,
                opacity: controlsOpacity,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 4,
                paddingHorizontal: 4,
            }}>

                <Text style={[textStyle, { backgroundColor: 'transparent', marginLeft: 5 }]}>
                    {getMMSSFromMillis(playbackInstancePosition)}
                </Text>


                {!disableSlider && (<TouchableWithoutFeedback onLayout={onSliderLayout} onPress={onSeekBarTap}>
                    <Slider
                        style={{ marginRight: 10, marginLeft: 10, flex: 1 }}
                        // thumbTintColor={sliderColor}
                        // thumbTintColor={sliderColor}
                        // minimumTrackTintColor={sliderColor || ThemeColors.primaryColorRgba + '0.3)'}
                        thumbTintColor={ThemeColors.primaryColor}
                        maximumTrackTintColor={ThemeColors.primaryColorRgba + '0.3)'}
                        minimumTrackTintColor={ThemeColors.primaryColor}
                        trackImage={iosTrackImage}
                        thumbImage={thumbImage}
                        value={getSeekSliderPosition()}
                        onValueChange={onSeekSliderValueChange}
                        onSlidingComplete={onSeekSliderSlidingComplete}
                        disabled={playbackState === PlaybackStates.Loading ||
                            playbackState === PlaybackStates.Ended ||
                            playbackState === PlaybackStates.Error ||
                            controlsState !== ControlStates.Shown} />
                    {/* <CustomSlider
                        style={{ marginRight: 10, marginLeft: 10, flex: 1 }}
                        maximumTrackTintColor={ThemeColors.primaryColorRgba + '0.3)'}
                        minimumTrackTintColor={ThemeColors.primaryColor}
                        value={getSeekSliderPosition()}
                        onValueChange={onSeekSliderValueChange}
                        onSlidingComplete={onSeekSliderSlidingComplete}
                        disabled={
                            playbackState === PlaybackStates.Loading ||
                            playbackState === PlaybackStates.Ended ||
                            playbackState === PlaybackStates.Error ||
                            controlsState !== ControlStates.Shown
                        }
                    /> */}
                </TouchableWithoutFeedback>)}

                <Text style={[textStyle, { backgroundColor: 'transparent', marginRight: 5 }]}>
                    {getMMSSFromMillis(playbackInstanceDuration)}
                </Text>


                {showFullscreenButton && (<Control transparent={true} center={false} callback={() => {
                    inFullscreen ? switchToPortrait() : switchToLandscape();
                }}>
                    {
                        // @ts-ignore
                        inFullscreen ? <VideoFullscreenExitIcon /> : <VideoFullscreenEnterIcon />}
                </Control>)}
            </Animated.View>
        </View>
    </TouchableWithoutFeedback>);
};
export default withDefaultProps(VideoPlayer, defaultProps);













// import { __rest } from "tslib";
// import { Animated, Dimensions, Slider, Text, TouchableOpacity, TouchableWithoutFeedback, View, ActivityIndicator, StyleSheet } from 'react-native';
// import { Audio, Video } from 'expo-av';
// import { useNetInfo } from '@react-native-community/netinfo';
// import { withDefaultProps } from 'with-default-props';
// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// import React, { useEffect, useState, useRef } from 'react';
// import { Icon } from "native-base";
// import ThemeColors from './../../styles/colors';
// import { AppIcon, AppImageIcon } from './Icon'
// import CustomSlider from './Slider'
// import { appFontScale } from "../../helpers/mixin";
// // eslint-disable-next-line @typescript-eslint/no-var-requires
// const IOS_THUMB_IMAGE = require('../../../assets/images/akLogo.png');
// // eslint-disable-next-line @typescript-eslint/no-var-requires
// const IOS_TRACK_IMAGE = require('../../../assets/images/loginScreen.jpg');
// const FullscreenEnterIcon = require('../../../assets/images/akLogo.png');
// const FullscreenExitIcon = require('../../../assets/images/akLogo.png');
// const PauseIcon = require('../../../assets/videoIcons/pause.png');
// const PlayIcon = require('../../../assets/videoIcons/play.png');
// const ReplayIcon = require('../../../assets/videoIcons/play.png');
// const Spinner = require('../../../assets/videoIcons/bomb.png');
// // import { FullscreenEnterIcon, FullscreenExitIcon, PauseIcon, PlayIcon, ReplayIcon, Spinner, } from './assets/icons';

// var prevProps = {}

// const SLIDER_COLOR = '#009485';
// const BUFFERING_SHOW_DELAY = 200;
// // UI states
// var ControlStates;
// (function (ControlStates) {
//     ControlStates["Shown"] = "Show";
//     ControlStates["Showing"] = "Showing";
//     ControlStates["Hidden"] = "Hidden";
//     ControlStates["Hiding"] = "Hiding";
// })(ControlStates || (ControlStates = {}));
// var PlaybackStates;
// (function (PlaybackStates) {
//     PlaybackStates["Loading"] = "Loading";
//     PlaybackStates["Playing"] = "Playing";
//     PlaybackStates["Paused"] = "Paused";
//     PlaybackStates["Buffering"] = "Buffering";
//     PlaybackStates["Error"] = "Error";
//     PlaybackStates["Ended"] = "Ended";
// })(PlaybackStates || (PlaybackStates = {}));
// var SeekStates;
// (function (SeekStates) {
//     SeekStates["NotSeeking"] = "NotSeeking";
//     SeekStates["Seeking"] = "Seeking";
//     SeekStates["Seeked"] = "Seeked";
// })(SeekStates || (SeekStates = {}));
// var ErrorSeverity;
// (function (ErrorSeverity) {
//     ErrorSeverity["Fatal"] = "Fatal";
//     ErrorSeverity["NonFatal"] = "NonFatal";
// })(ErrorSeverity || (ErrorSeverity = {}));
// const defaultProps = {
//     children: null,
//     debug: false,
//     inFullscreen: false,
//     width: Dimensions.get('window').width,
//     height: Dimensions.get('window').height,
//     // Animations
//     fadeInDuration: 200,
//     fadeOutDuration: 1000,
//     quickFadeOutDuration: 200,
//     hideControlsTimerDuration: 4000,
//     // Icons
//     playIcon: null,
//     replayIcon: null,
//     pauseIcon: null,
//     spinner: 'ActivityIndicator',
//     fullscreenEnterIcon: null,
//     fullscreenExitIcon: null,
//     // Appearance
//     showFullscreenButton: true,
//     iosThumbImage: null,
//     iosTrackImage: null,
//     textStyle: {
//         color: ThemeColors.primaryColor,
//         fontSize: appFontScale(12),
//     },
//     videoBackground: ThemeColors.backgroundColor,
//     // Callbacks
//     errorCallback: (error) => console.error('Error: ', error.message, error.type, error.obj),
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     playbackCallback: (callback) => { },
//     switchToLandscape: () => console.warn(`Pass your logic to 'switchToLandscape' prop`),
//     switchToPortrait: () => console.warn(`Pass your logic to 'switchToPortrait' prop`),
//     showControlsOnLoad: false,
//     sliderColor: SLIDER_COLOR,
// };
// const VideoPlayer = (props) => {
//     let playbackInstance = null;
//     let showingAnimation = null;
//     let hideAnimation = null;
//     let shouldPlayAtEndOfSeek = false;
//     let controlsTimer = null;
//     const { isConnected } = useNetInfo();
//     const [playbackState, setPlaybackState] = useState(PlaybackStates.Loading);
//     const [lastPlaybackStateUpdate, setLastPlaybackStateUpdate] = useState(Date.now());
//     const [seekState, setSeekState] = useState(SeekStates.NotSeeking);
//     const [playbackInstancePosition, setPlaybackInstancePosition] = useState(0);
//     const [playbackInstanceDuration, setPlaybackInstanceDuration] = useState(0);
//     const [shouldPlay, setShouldPlay] = useState(false);
//     const [error, setError] = useState('');
//     const [sliderWidth, setSliderWidth] = useState(0);
//     const [controlsState, setControlsState] = useState(props.showControlsOnLoad ? ControlStates.Shown : ControlStates.Hidden);
//     const [controlsOpacity] = useState(new Animated.Value(props.showControlsOnLoad ? 1 : 0));
//     // Set audio mode to play even in silent mode (like the YouTube app)
//     const setAudio = async () => {
//         const { errorCallback } = props;
//         try {
//             await Audio.setAudioModeAsync({
//                 allowsRecordingIOS: false,
//                 interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
//                 playsInSilentModeIOS: true,
//                 shouldDuckAndroid: true,
//                 interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
//                 playThroughEarpieceAndroid: false,
//                 staysActiveInBackground: false,
//             });
//         }
//         catch (e) {
//             errorCallback({
//                 type: ErrorSeverity.NonFatal,
//                 message: 'setAudioModeAsync error',
//                 obj: e,
//             });
//         }
//     };
//     useEffect(() => {
//         setPlaybackState(PlaybackStates?.Loading)
//         replay();
//         setAudio();
//         // prevProps = videoProps;
//     }, [props.videoProps.source?.uri])
//     useEffect(() => {
//         const { videoProps } = props;
//         if (videoProps?.source === null) {
//             console.error('`Source` is a required property');
//             throw new Error('`Source` is required');
//         }
//     });
//     // Handle events during playback
//     const updatePlaybackState = (newPlaybackState) => {
//         if (playbackState !== newPlaybackState) {
//             const { debug } = props;
//             debug &&
//                 console.info('[playback]', playbackState, ' -> ', newPlaybackState, ' [seek] ', seekState, ' [shouldPlay] ', shouldPlay);
//             setPlaybackState(newPlaybackState);
//             setLastPlaybackStateUpdate(Date.now());
//         }
//     };
//     const updateSeekState = (newSeekState) => {
//         const { debug } = props;
//         debug &&
//             console.info('[seek]', seekState, ' -> ', newSeekState, ' [playback] ', playbackState, ' [shouldPlay] ', shouldPlay);
//         setSeekState(newSeekState);
//         // Don't keep the controls timer running when the state is seeking
//         if (newSeekState === SeekStates.Seeking) {
//             controlsTimer && clearTimeout(controlsTimer);
//         }
//         else {
//             // Start the controlFs timer anew
//             resetControlsTimer();
//         }
//     };
//     const updatePlaybackCallback = (status) => {
//         const { errorCallback, playbackCallback } = props;
//         try {
//             playbackCallback(status);
//         }
//         catch (e) {
//             console.error('Uncaught error when calling props.playbackCallback', e);
//         }
//         if (!status.isLoaded) {
//             if (status.error) {
//                 updatePlaybackState(PlaybackStates.Error);
//                 const errorMsg = `This video is not available right now.\nPlease try again later`;
//                 // const errorMsg = `Encountered a fatal error during playback: ${status.error}`;
//                 setError(errorMsg);
//                 errorCallback({ type: ErrorSeverity.Fatal, message: errorMsg, obj: {} });
//             }
//         }
//         else {
//             // Update current position, duration, and `shouldPlay`
//             setPlaybackInstancePosition(status.positionMillis || 0);
//             setPlaybackInstanceDuration(status.durationMillis || 0);
//             setShouldPlay(status.shouldPlay);
//             // Figure out what state should be next (only if we are not seeking,
//             // other the seek action handlers control the playback state, not this callback)
//             if (seekState === SeekStates.NotSeeking && playbackState !== PlaybackStates.Ended) {
//                 if (status.didJustFinish && !status.isLooping) {
//                     updatePlaybackState(PlaybackStates.Ended);
//                 }
//                 else {
//                     // If the video is buffering but there is no Internet, you go to the Error state
//                     if (!isConnected && status.isBuffering) {
//                         updatePlaybackState(PlaybackStates.Error);
//                         setError('You are probably offline.' +
//                             'Please make sure you are connected to the Internet to watch this video');
//                     }
//                     else {
//                         updatePlaybackState(isPlayingOrBufferingOrPaused(status));
//                     }
//                 }
//             }
//         }
//     };
//     // Seeking
//     const getSeekSliderPosition = () => playbackInstancePosition / playbackInstanceDuration || 0;
//     const onSeekSliderValueChange = async () => {
//         if (playbackInstance !== null && seekState !== SeekStates.Seeking) {
//             updateSeekState(SeekStates.Seeking);
//             // A seek might have finished (Seeked) but since we are not in NotSeeking yet, the `shouldPlay` flag is still false,
//             // but we really want it be the stored value from before the previous seek
//             shouldPlayAtEndOfSeek = seekState === SeekStates.Seeked ? shouldPlayAtEndOfSeek : shouldPlay;
//             // Pause the video
//             await playbackInstance.setStatusAsync({ shouldPlay: false });
//         }
//     };
//     const onSeekSliderSlidingComplete = async (value) => {
//         if (playbackInstance !== null) {
//             const { debug } = props;
//             // Seeking is done, so go to Seeked, and set playbackState to Buffering
//             updateSeekState(SeekStates.Seeked);
//             // If the video is going to play after seek, the user expects a spinner.
//             // Otherwise, the user expects the play button
//             updatePlaybackState(shouldPlayAtEndOfSeek ? PlaybackStates.Buffering : PlaybackStates.Paused);
//             try {
//                 const playback = await playbackInstance.setStatusAsync({
//                     positionMillis: value * playbackInstanceDuration,
//                     shouldPlay: shouldPlayAtEndOfSeek,
//                 });
//                 // The underlying <Video> has successfully updated playback position
//                 // TODO: If `shouldPlayAtEndOfSeek` is false, should we still set the playbackState to Paused?
//                 // But because we setStatusAsync(shouldPlay: false), so the AVPlaybackStatus return value will be Paused.
//                 updateSeekState(SeekStates.NotSeeking);
//                 updatePlaybackState(isPlayingOrBufferingOrPaused(playback));
//             }
//             catch (e) {
//                 debug && console.error('Seek error: ', e);
//             }
//         }
//     };
//     const isPlayingOrBufferingOrPaused = (status) => {
//         if (!status.isLoaded) {
//             return PlaybackStates.Error;
//         }
//         if (status.isPlaying) {
//             return PlaybackStates.Playing;
//         }
//         if (status.isBuffering) {
//             return PlaybackStates.Buffering;
//         }
//         return PlaybackStates.Paused;
//     };
//     const onSeekBarTap = (e) => {
//         if (!(playbackState === PlaybackStates.Loading ||
//             playbackState === PlaybackStates.Ended ||
//             playbackState === PlaybackStates.Error ||
//             controlsState !== ControlStates.Shown)) {
//             const value = e.nativeEvent.locationX / sliderWidth;
//             onSeekSliderValueChange();
//             onSeekSliderSlidingComplete(value);
//         }
//     };
//     // Capture the width of the seekbar slider for use in `_onSeekbarTap`
//     const onSliderLayout = (e) => {
//         setSliderWidth(e.nativeEvent.layout.width);
//     };
//     // Controls view
//     const getMMSSFromMillis = (millis) => {
//         const totalSeconds = millis / 1000;
//         const seconds = String(Math.floor(totalSeconds % 60));
//         const minutes = String(Math.floor(totalSeconds / 60));
//         return minutes.padStart(2, '0') + ':' + seconds.padStart(2, '0');
//     };
//     // Controls Behavior
//     const replay = async () => {
//         if (playbackInstance !== null) {
//             await playbackInstance.setStatusAsync({
//                 shouldPlay: true,
//                 positionMillis: 0,
//             });
//             // Update playbackState to get out of Ended state
//             setPlaybackState(PlaybackStates.Playing);
//         }
//     };
//     const togglePlay = async () => {
//         if (controlsState === ControlStates.Hidden) {
//             return;
//         }
//         const shouldPlay = playbackState !== PlaybackStates.Playing;
//         if (playbackInstance !== null) {
//             await playbackInstance.setStatusAsync({ shouldPlay });
//         }
//     };
//     const toggleControls = () => {
//         switch (controlsState) {
//             case ControlStates.Shown:
//                 // If the controls are currently Shown, a tap should hide controls quickly
//                 setControlsState(ControlStates.Hiding);
//                 hideControls(true);
//                 break;
//             case ControlStates.Hidden:
//                 // If the controls are currently, show controls with fade-in animation
//                 showControls();
//                 setControlsState(ControlStates.Showing);
//                 break;
//             case ControlStates.Hiding:
//                 // If controls are fading out, a tap should reverse, and show controls
//                 setControlsState(ControlStates.Showing);
//                 showControls();
//                 break;
//             case ControlStates.Showing:
//                 // A tap when the controls are fading in should do nothing
//                 break;
//         }
//     };
//     const showControls = () => {
//         const { fadeInDuration } = props;
//         showingAnimation = Animated.timing(controlsOpacity, {
//             toValue: 1,
//             duration: fadeInDuration,
//             useNativeDriver: true,
//         });
//         showingAnimation.start(({ finished }) => {
//             if (finished) {
//                 setControlsState(ControlStates.Shown);
//                 resetControlsTimer();
//             }
//         });
//     };
//     const hideControls = (immediately = false) => {
//         const { quickFadeOutDuration, fadeOutDuration } = props;
//         if (controlsTimer) {
//             clearTimeout(controlsTimer);
//         }
//         hideAnimation = Animated.timing(controlsOpacity, {
//             toValue: 0,
//             duration: immediately ? quickFadeOutDuration : fadeOutDuration,
//             useNativeDriver: true,
//         });
//         hideAnimation.start(({ finished }) => {
//             if (finished) {
//                 setControlsState(ControlStates.Hidden);
//             }
//         });
//     };
//     const onTimerDone = () => {
//         // After the controls timer runs out, fade away the controls slowly
//         setControlsState(ControlStates.Hiding);
//         hideControls();
//     };
//     const resetControlsTimer = () => {
//         const { hideControlsTimerDuration } = props;
//         if (controlsTimer) {
//             clearTimeout(controlsTimer);
//         }
//         controlsTimer = setTimeout(() => onTimerDone(), hideControlsTimerDuration);
//     };
//     const { playIcon: VideoPlayIcon, pauseIcon: VideoPauseIcon, spinner: VideoSpinner, fullscreenEnterIcon: VideoFullscreenEnterIcon, fullscreenExitIcon: VideoFullscreenExitIcon, replayIcon: VideoReplayIcon, switchToLandscape, switchToPortrait, inFullscreen, sliderColor, iosThumbImage, iosTrackImage, showFullscreenButton, textStyle, videoProps, videoBackground, width, height, } = props;
//     const centeredContentWidth = 60;
//     const screenRatio = width / height;
//     let videoHeight = height;
//     let videoWidth = videoHeight * screenRatio;
//     if (videoWidth > width) {
//         videoWidth = width;
//         videoHeight = videoWidth / screenRatio;
//     }
//     // Do not let the user override `ref`, `callback`, and `style`
//     // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
//     // @ts-ignore
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     const { ref, style, onPlaybackStatusUpdate, source } = videoProps, otherVideoProps = __rest(videoProps, ["ref", "style", "onPlaybackStatusUpdate", "source"]);
//     const Control = (_a) => {
//         var { callback, center, children, transparent = false } = _a, otherProps = __rest(_a, ["callback", "center", "children", "transparent"]);
//         return (<TouchableOpacity {...otherProps} hitSlop={{ top: 20, left: 20, bottom: 20, right: 20 }} onPress={() => {
//             resetControlsTimer();
//             callback();
//         }}>
//             <View style={center && {
//                 backgroundColor: transparent ? 'transparent' : 'rgba(0, 0, 0, 0.4)',
//                 justifyContent: 'center',
//                 width: centeredContentWidth,
//                 height: centeredContentWidth,
//                 borderRadius: centeredContentWidth,
//             }}>
//                 {children}
//             </View>
//         </TouchableOpacity>);
//     };
//     const CenteredView = (_a) => {
//         var { children, style: viewStyle } = _a,
//             // pointerEvents,
//             otherProps = __rest(_a, ["children", "style"]);
//         return (<Animated.View {...otherProps} style={[
//             {
//                 position: 'absolute',
//                 left: (videoWidth - centeredContentWidth) / 2,
//                 top: (videoHeight - centeredContentWidth) / 2,
//                 width: centeredContentWidth,
//                 height: centeredContentWidth,
//                 flexDirection: 'column',
//                 justifyContent: 'center',
//                 alignItems: 'center',
//             },
//             viewStyle,
//         ]}>
//             {children}
//         </Animated.View>);
//     };
//     const ErrorText = ({ text }) => (<View style={{
//         position: 'absolute',
//         top: videoHeight / 2,
//         width: videoWidth - 40,
//         marginRight: 20,
//         marginLeft: 20,
//     }}>
//         <Text style={[textStyle, { textAlign: 'center' }]}>{text}</Text>
//     </View>);
//     const presentNativeFullScreen = () => {
//         playbackInstance.presentFullscreenPlayer()
//     }
//     return (<TouchableWithoutFeedback onPress={toggleControls}>
//         <View style={{ backgroundColor: videoBackground, flex: 1 }}>
//             <Video
//                 source={source}
//                 ref={component => {
//                     playbackInstance = component;
//                     ref && ref(component);
//                 }}
//                 onPlaybackStatusUpdate={updatePlaybackCallback}
//                 style={{
//                     width: videoWidth,
//                     height: videoHeight,
//                 }}
//                 {...otherVideoProps}
//             />
//             {
//                 controlsState == ControlStates.Showing || controlsState == ControlStates.Shown &&
//                 <OverLay width={videoWidth} height={videoHeight} />
//             }

//             {((
//                 playbackState === PlaybackStates.Buffering &&
//                 Date.now() - lastPlaybackStateUpdate > BUFFERING_SHOW_DELAY) ||
//                 playbackState === PlaybackStates.Loading) && (
//                     <View style={{
//                         position: 'absolute',
//                         left: (videoWidth - centeredContentWidth) / 2,
//                         top: (videoHeight - centeredContentWidth) / 2,
//                         width: centeredContentWidth,
//                         height: centeredContentWidth,
//                         flexDirection: 'column',
//                         justifyContent: 'center',
//                         alignItems: 'center',
//                     }}>
//                         <ActivityIndicator color={ThemeColors.primaryColor} />
//                     </View>
//                 )
//             }


//             {seekState !== SeekStates.Seeking &&
//                 (playbackState === PlaybackStates.Playing || playbackState === PlaybackStates.Paused)
//                 && (<CenteredView pointerEvents={controlsState === ControlStates.Hidden ? 'none' : 'auto'}
//                     // @ts-ignore
//                     style={{ opacity: playbackState === PlaybackStates.Paused ? 1 : controlsOpacity }}
//                 >
//                     {/* <Control center={true} callback={togglePlay}> */}
//                     <TouchableOpacity onPress={togglePlay} style={styles.alignSelfCenter}>
//                         {playbackState === PlaybackStates.Playing && <AppImageIcon size={40} source={PauseIcon} />}
//                         {playbackState === PlaybackStates.Paused && <AppImageIcon size={40} source={PlayIcon} />}
//                     </TouchableOpacity>
//                     {/* {playbackState === PlaybackStates.Playing && <AppIcon name='pause-circle' />}
//                         {playbackState === PlaybackStates.Paused && <AppIcon name='play-circle' />} */}
//                     {/* {playbackState === PlaybackStates.Playing && <VideoPauseIcon />}
//                         {playbackState === PlaybackStates.Paused && <VideoPlayIcon />} */}
//                     {/* </Control> */}
//                 </CenteredView>)}


//             {playbackState === PlaybackStates.Ended && (<CenteredView>
//                 <Control center={true} callback={replay}>
//                     <AppIcon containerStyles={styles.alignSelfCenter} size={40} name='replay' />
//                     {/* <VideoReplayIcon /> */}
//                 </Control>
//             </CenteredView>)}


//             {playbackState === PlaybackStates.Error && <ErrorText text={error} />}


//             <Animated.View pointerEvents={controlsState === ControlStates.Hidden ? 'none' : 'auto'} style={{
//                 position: 'absolute',
//                 bottom: 0,
//                 width: videoWidth,
//                 opacity: controlsOpacity,
//                 flexDirection: 'row',
//                 alignItems: 'center',
//                 justifyContent: 'space-between',
//                 paddingBottom: 4,
//                 paddingHorizontal: 4,
//             }}>

//                 <Text style={[textStyle, styles.timeStyles, { backgroundColor: 'transparent', marginHorizontal: 5 }]}>
//                     {getMMSSFromMillis(playbackInstancePosition)}
//                 </Text>


//                 <TouchableWithoutFeedback onLayout={onSliderLayout} onPress={onSeekBarTap}>
//                     <CustomSlider
//                         style={styles.flex1}
//                         maximumTrackTintColor={ThemeColors.primaryColorRgba + '0.3)'}
//                         minimumTrackTintColor={ThemeColors.primaryColor}
//                         value={getSeekSliderPosition()}
//                         onValueChange={onSeekSliderValueChange}
//                         onSlidingComplete={onSeekSliderSlidingComplete}
//                         disabled={
//                             playbackState === PlaybackStates.Loading ||
//                             playbackState === PlaybackStates.Ended ||
//                             playbackState === PlaybackStates.Error ||
//                             controlsState !== ControlStates.Shown
//                         }
//                     />
//                     {/* <Slider
//                         style={{ marginRight: 10, marginLeft: 10, flex: 1 }}
//                         thumbTintColor={sliderColor}
//                         minimumTrackTintColor={sliderColor}
//                         //  trackImage={iosTrackImage}
//                         //   thumbImage={iosThumbImage}
//                         value={getSeekSliderPosition()}
//                         onValueChange={onSeekSliderValueChange}
//                         onSlidingComplete={onSeekSliderSlidingComplete}
//                         disabled={
//                             playbackState === PlaybackStates.Loading ||
//                             playbackState === PlaybackStates.Ended ||
//                             playbackState === PlaybackStates.Error ||
//                             controlsState !== ControlStates.Shown
//                         }
//                     /> */}
//                 </TouchableWithoutFeedback>


//                 <Text style={[textStyle, styles.timeStyles, { backgroundColor: 'transparent', marginHorizontal: 5 }]}>
//                     {getMMSSFromMillis(playbackInstanceDuration)}
//                 </Text>


//                 {showFullscreenButton && (<Control transparent={true} center={false} callback={presentNativeFullScreen}>
//                     <AppIcon name='fullscreen' />
//                     {/* {inFullscreen ? <VideoFullscreenExitIcon /> : <VideoFullscreenEnterIcon />} */}
//                 </Control>)}
//             </Animated.View>
//         </View>
//     </TouchableWithoutFeedback>);
// };
// export default withDefaultProps(VideoPlayer, defaultProps);
// // const MyIcon = ({ name, color }) => (<Icon type='MaterialCommunityIcons' name={name} style={{ color: color || ThemeColors.primaryColor, alignSelf: 'center' }} />)
// const OverLay = ({ children, width, height }) => {
//     return <View style={[styles.overlay, { width: width, height: height }]}>{children}</View>
// }
// const styles = StyleSheet.create({
//     flex1: {
//         flex: 1,
//     },
//     alignSelfCenter: {
//         alignSelf: 'center'
//     },
//     spinner: {
//         color: ThemeColors.primaryColor
//     },
//     overlay: {
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         backgroundColor: ThemeColors.backgroundColorRgba + '0.5)',
//     },
//     timeStyles: {
//         color: ThemeColors.primaryColor,
//         fontSize: 10
//     },

// })