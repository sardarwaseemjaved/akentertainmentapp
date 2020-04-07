/**
 * @flow
 */

import React from "react";
import {
    StatusBar,
    Share,
    Dimensions,
    Image,
    Slider,
    StyleSheet,
    Platform,
    Text,
    TouchableHighlight,
    TouchableOpacity,
    ScrollView,
    TouchableWithoutFeedback,
    ActivityIndicator,
    FlatList,
    View,
    ImageBackground
} from "react-native";
import { Linking } from 'expo'
import { Asset } from "expo-asset";
import { Audio, Video } from "expo-av";
import * as Font from "expo-font";
import ThemeColors from './../../styles/colors';
import { MaterialIcons } from "@expo/vector-icons";
import Swiper from "react-native-swiper";
import * as FileSystem from 'expo-file-system';
import Carousel, { ParallaxImage } from 'react-native-snap-carousel';
import * as Sharing from 'expo-sharing';
import api from "../../api";
import { Icon } from 'native-base'
import CustomSlider from '../shared/Slider'
// class Icon {
//     constructor(module, width, height) {
//         this.module = module;
//         this.width = width;
//         this.height = height;
//         Asset.fromModule(this.module).downloadAsync();
//     }
// }

class PlaylistItem {
    constructor(name, uri, isVideo, thumbnail) {
        this.name = name;
        this.uri = uri;
        this.isVideo = isVideo;
        this.thumbnail = thumbnail
    }
}

// const PLAYLIST = [
//   new PlaylistItem(
//     "Comfort Fit - “Sorry”",
//     "https://s3.amazonaws.com/exp-us-standard/audio/playlist-example/Comfort_Fit_-_03_-_Sorry.mp3",
//     false
//   ),
//   new PlaylistItem(
//     "Big Buck Bunny",
//     "http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
//     true
//   ),
//   new PlaylistItem(
//     "Mildred Bailey – “All Of Me”",
//     "https://ia800304.us.archive.org/34/items/PaulWhitemanwithMildredBailey/PaulWhitemanwithMildredBailey-AllofMe.mp3",
//     false
//   ),
//   new PlaylistItem(
//     "Popeye - I don't scare",
//     "https://ia800501.us.archive.org/11/items/popeye_i_dont_scare/popeye_i_dont_scare_512kb.mp4",
//     true
//   ),
//   new PlaylistItem(
//     "Podington Bear - “Rubber Robot”",
//     "https://s3.amazonaws.com/exp-us-standard/audio/playlist-example/Podington_Bear_-_Rubber_Robot.mp3",
//     false
//   )
// ];

const ICON_THROUGH_EARPIECE = "speaker-phone";
const ICON_THROUGH_SPEAKER = "speaker";

const ICON_PLAY_BUTTON = new Icon(
    require("./assets/images/play_button.png"),
    34,
    51
);
const ICON_PAUSE_BUTTON = new Icon(
    require("./assets/images/pause_button.png"),
    34,
    51
);
const ICON_STOP_BUTTON = new Icon(
    require("./assets/images/stop_button.png"),
    22,
    22
);
const ICON_FORWARD_BUTTON = new Icon(
    require("./assets/images/forward_button.png"),
    33,
    25
);
const ICON_BACK_BUTTON = new Icon(
    require("./assets/images/back_button.png"),
    33,
    25
);

const ICON_LOOP_ALL_BUTTON = new Icon(
    require("./assets/images/loop_all_button.png"),
    77,
    35
);
const ICON_LOOP_ONE_BUTTON = new Icon(
    require("./assets/images/loop_one_button.png"),
    77,
    35
);

const ICON_MUTED_BUTTON = new Icon(
    require("./assets/images/muted_button.png"),
    67,
    58
);
const ICON_UNMUTED_BUTTON = new Icon(
    require("./assets/images/unmuted_button.png"),
    67,
    58
);

const ICON_TRACK_1 = new Icon(require("./assets/images/track_1.png"), 166, 5);
const ICON_THUMB_1 = new Icon(require("./assets/images/thumb_1.png"), 18, 19);
const ICON_THUMB_2 = new Icon(require("./assets/images/thumb_2.png"), 15, 19);

const LOOPING_TYPE_ALL = 0;
const LOOPING_TYPE_ONE = 1;
const LOOPING_TYPE_ICONS = { 0: ICON_LOOP_ALL_BUTTON, 1: ICON_LOOP_ONE_BUTTON };

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get("window");
const BACKGROUND_COLOR = "#FFF8ED";
const DISABLED_OPACITY = 0.5;
const FONT_SIZE = 14;
const LOADING_STRING = "... loading ...";
const BUFFERING_STRING = "...buffering...";
const RATE_SCALE = 3.0;
// const VIDEO_CONTAINER_HEIGHT = (DEVICE_HEIGHT * 2.0) / 5.0 - FONT_SIZE * 2; 
const VIDEO_CONTAINER_HEIGHT = DEVICE_HEIGHT;

export default class CustomPlayer extends React.Component {
    timer;
    constructor(props) {
        super(props);
        this.index = 0;
        this.isSeeking = false;
        this.shouldPlayAtEndOfSeek = false;
        this.playbackInstance = null;
        this.state = {
            PLAYLIST: this.props.playlist.map((val, index) => {
                return (new PlaylistItem(
                    val.name,
                    val.url,
                    true,
                    val.thumbnail
                ))
            }),
            volume: 1,
            showPlayerControls: true,
            showVideo: false,
            playbackInstanceName: LOADING_STRING,
            loopingType: LOOPING_TYPE_ALL,
            muted: false,
            playbackInstancePosition: null,
            playbackInstanceDuration: null,
            shouldPlay: false,
            isPlaying: false,
            isBuffering: false,
            isLoading: true,
            fontLoaded: true,
            shouldCorrectPitch: true,
            volume: 1.0,
            rate: 1.0,
            videoWidth: DEVICE_WIDTH,
            videoHeight: VIDEO_CONTAINER_HEIGHT,
            poster: false,
            useNativeControls: false,
            fullscreen: false,
            throughEarpiece: false,
            currentVideoIndex: 0,
            videoLikedBy: []
        };
    }
    componentDidUpdate(prevProps, prevState) {
        if (prevProps.playlist.length != this.state.PLAYLIST.length) {
            this.state.PLAYLIST = this.props.playlist.map((val, index) => {
                return (new PlaylistItem(val.name, val.url, true, val.thumbnail))
            });
            this.setState({ PLAYLIST: this.state.PLAYLIST })
            this.setVideoLikes()
        }
    }
    setVideoLikes = async () => {
        const videoLikedBy = await api.getVideoLikes(this.props.playlist[this.index].id)
        console.log('videoLikedBy:', videoLikedBy, this.props.playlist[this.index].id)
        this.setState({ videoLikedBy })
    }
    componentDidMount() {
        this.showPlayerControls()
        this.setVideoLikes()
        // Audio.setAudioModeAsync({
        //     allowsRecordingIOS: false,
        //     staysActiveInBackground: false,
        //     interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        //     playsInSilentModeIOS: true,
        //     shouldDuckAndroid: true,
        //     interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        //     playThroughEarpieceAndroid: false
        // });
        // (async () => {
        //     await Font.loadAsync({
        //         ...MaterialIcons.font,
        //         "cutive-mono-regular": require("./assets/fonts/CutiveMono-Regular.ttf")
        //     });
        //     this.setState({ fontLoaded: true });
        // })();
    }

    async _loadNewPlaybackInstance(playing) {
        if (this.playbackInstance != null) {
            await this.playbackInstance.unloadAsync();
            // this.playbackInstance.setOnPlaybackStatusUpdate(null);
            this.playbackInstance = null;
        }

        const source = { uri: this.state.PLAYLIST[this.index].uri };
        const initialStatus = {
            shouldPlay: playing,
            rate: this.state.rate,
            shouldCorrectPitch: this.state.shouldCorrectPitch,
            volume: this.state.volume,
            isMuted: this.state.muted,
            isLooping: this.state.loopingType === LOOPING_TYPE_ONE
            // // UNCOMMENT THIS TO TEST THE OLD androidImplementation:
            // androidImplementation: 'MediaPlayer',
        };

        if (this.state.PLAYLIST[this.index].isVideo) {
            console.log(this._onPlaybackStatusUpdate);
            await this._video.loadAsync(source, initialStatus);
            // this._video.onPlaybackStatusUpdate(this._onPlaybackStatusUpdate);
            this.playbackInstance = this._video;
            const status = await this._video.getStatusAsync();
        } else {
            const { sound, status } = await Audio.Sound.createAsync(
                source,
                initialStatus,
                this._onPlaybackStatusUpdate
            );
            this.playbackInstance = sound;
        }

        this._updateScreenForLoading(false);
    }

    _mountVideo = component => {
        this._video = component;
        this._loadNewPlaybackInstance(false);
    };

    _updateScreenForLoading(isLoading) {
        if (isLoading) {
            this.setState({
                showVideo: false,
                isPlaying: false,
                playbackInstanceName: LOADING_STRING,
                playbackInstanceDuration: null,
                playbackInstancePosition: null,
                isLoading: true
            });
        } else {
            this.setState({
                playbackInstanceName: this.state.PLAYLIST[this.index].name,
                showVideo: this.state.PLAYLIST[this.index].isVideo,
                isLoading: false
            });
        }
    }

    _onPlaybackStatusUpdate = status => {
        if (status.isLoaded) {
            this.setState({
                playbackInstancePosition: status.positionMillis,
                playbackInstanceDuration: status.durationMillis,
                shouldPlay: status.shouldPlay,
                isPlaying: status.isPlaying,
                isBuffering: status.isBuffering,
                rate: status.rate,
                muted: status.isMuted,
                volume: status.volume,
                loopingType: status.isLooping ? LOOPING_TYPE_ONE : LOOPING_TYPE_ALL,
                shouldCorrectPitch: status.shouldCorrectPitch
            });
            if (status.didJustFinish && !status.isLooping) {
                this._advanceIndex(true);
                this._updatePlaybackInstanceForIndex(true);
            }
        } else {
            if (status.error) {
                console.log(`FATAL PLAYER ERROR: ${status.error}`);
            }
        }
    };

    _onLoadStart = () => {
        try {
            this.setState({ fontLoaded: false })
        } catch (error) {
            console.log(`ON LOAD START Error:${error}`);
        }
        console.log(`ON LOAD START`);
    };

    _onLoad = status => {
        try {
            this.showPlayerControls()
            this.setState({ fontLoaded: true })
        }
        catch (error) {
            console.log(`ON LOAD Error:${error}`);
        }
        console.log(`ON LOAD : ${JSON.stringify(status)}`);
    };

    _onError = error => {
        this._video = null;
        this.setState({ fontLoaded: true })
        console.log(`ON ERROR : ${error}`);
    };

    _onReadyForDisplay = event => {
        const widestHeight =
            (DEVICE_WIDTH * event.naturalSize.height) / event.naturalSize.width;
        if (widestHeight > VIDEO_CONTAINER_HEIGHT) {
            this.setState({
                fontLoaded: true,
                videoWidth:
                    (VIDEO_CONTAINER_HEIGHT * event.naturalSize.width) /
                    event.naturalSize.height,
                videoHeight: VIDEO_CONTAINER_HEIGHT
            });
        } else {
            this.setState({
                fontLoaded: true,
                videoWidth: DEVICE_WIDTH,
                videoHeight:
                    (DEVICE_WIDTH * event.naturalSize.height) / event.naturalSize.width
            });
        }
    };




    _advanceIndex(forward) {
        this.index =
            (this.index + (forward ? 1 : this.state.PLAYLIST.length - 1)) % this.state.PLAYLIST.length;
    }

    async _updatePlaybackInstanceForIndex(playing) {
        this._updateScreenForLoading(true);

        this.setState({
            fontLoaded: true,
            videoWidth: DEVICE_WIDTH,
            videoHeight: VIDEO_CONTAINER_HEIGHT
        });

        this._loadNewPlaybackInstance(playing);
    }

    _onPlayPausePressed = () => {
        if (this.playbackInstance != null) {
            if (this.state.isPlaying) {
                this.playbackInstance.pauseAsync();
            } else {
                this.playbackInstance.playAsync();
            }
        }
    };

    _onStopPressed = () => {
        if (this.playbackInstance != null) {
            this.playbackInstance.stopAsync();
        }
    };

    _changeCurrentVideoToIndex = (index) => {
        this.setState({ currentVideoIndex: index })
        if (this.playbackInstance != null) {
            this.index = index;
            this._updatePlaybackInstanceForIndex(this.state.shouldPlay);
            this.setVideoLikes()
        }
    };
    _onForwardPressed = () => {
        if (this.playbackInstance != null) {
            this._advanceIndex(true);
            this._updatePlaybackInstanceForIndex(this.state.shouldPlay);
        }
    };

    _onBackPressed = () => {
        if (this.playbackInstance != null) {
            this._advanceIndex(false);
            this._updatePlaybackInstanceForIndex(this.state.shouldPlay);
        }
    };

    _onMutePressed = () => {
        if (this.playbackInstance != null) {
            this.playbackInstance.setIsMutedAsync(!this.state.muted);
        }
    };

    _onLoopPressed = () => {
        if (this.playbackInstance != null) {
            this.playbackInstance.setIsLoopingAsync(
                this.state.loopingType !== LOOPING_TYPE_ONE
            );
        }
    };

    _onVolumeSliderValueChange = volume => {
        this.setState({ volume })
        if (this.playbackInstance != null) {
            this.playbackInstance.setVolumeAsync(volume);
        }
    };

    _trySetRate = async (rate, shouldCorrectPitch) => {
        if (this.playbackInstance != null) {
            try {
                await this.playbackInstance.setRateAsync(rate, shouldCorrectPitch);
            } catch (error) {
                // Rate changing could not be performed, possibly because the client's Android API is too old.
            }
        }
    };

    _onRateSliderSlidingComplete = async value => {
        this._trySetRate(value * RATE_SCALE, this.state.shouldCorrectPitch);
    };

    _onPitchCorrectionPressed = async value => {
        this._trySetRate(this.state.rate, !this.state.shouldCorrectPitch);
    };

    _onSeekSliderValueChange = value => {
        if (this.playbackInstance != null && !this.isSeeking) {
            this.isSeeking = true;
            this.shouldPlayAtEndOfSeek = this.state.shouldPlay;
            this.playbackInstance.pauseAsync();
        }
    };

    _onSeekSliderSlidingComplete = async value => {
        if (this.playbackInstance != null) {
            this.isSeeking = false;
            const seekPosition = value * this.state.playbackInstanceDuration;
            if (this.shouldPlayAtEndOfSeek) {
                this.playbackInstance.playFromPositionAsync(seekPosition);
            } else {
                this.playbackInstance.setPositionAsync(seekPosition);
            }
        }
    };

    _getSeekSliderPosition() {
        if (
            this.playbackInstance != null &&
            this.state.playbackInstancePosition != null &&
            this.state.playbackInstanceDuration != null
        ) {
            return (
                this.state.playbackInstancePosition /
                this.state.playbackInstanceDuration
            );
        }
        return 0;
    }

    _getMMSSFromMillis(millis) {
        const totalSeconds = millis / 1000;
        const seconds = Math.floor(totalSeconds % 60);
        const minutes = Math.floor(totalSeconds / 60);

        const padWithZero = number => {
            const string = number.toString();
            if (number < 10) {
                return "0" + string;
            }
            return string;
        };
        return padWithZero(minutes) + ":" + padWithZero(seconds);
    }

    _getTimestamp() {
        if (
            this.playbackInstance != null &&
            this.state.playbackInstancePosition != null &&
            this.state.playbackInstanceDuration != null
        ) {
            return `${this._getMMSSFromMillis(
                this.state.playbackInstancePosition
            )} / ${this._getMMSSFromMillis(this.state.playbackInstanceDuration)}`;
        }
        return "";
    }

    _onPosterPressed = () => {
        this.setState({ poster: !this.state.poster });
    };

    _onUseNativeControlsPressed = () => {
        this.setState({ useNativeControls: !this.state.useNativeControls });
    };

    _onFullscreenPressed = () => {
        try {
            this._video.presentFullscreenPlayer();
        } catch (error) {
            console.log(error.toString());
        }
    };

    _onSpeakerPressed = () => {
        this.setState(
            state => {
                return { throughEarpiece: !state.throughEarpiece };
            },
            ({ throughEarpiece }) =>
                Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
                    playsInSilentModeIOS: true,
                    shouldDuckAndroid: true,
                    interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
                    playThroughEarpieceAndroid: throughEarpiece
                })
        );
    };

    showPlayerControls = () => {
        this.hideWithTimer();
        this.setState({ showPlayerControls: true, });
    }

    hidePlayerControls = () => {
        clearTimeout(this.timer);
        this.setState({ showPlayerControls: false, });
    }

    hideWithTimer = () => {
        this.timer = setTimeout(() => {
            this.hidePlayerControls()
        }, 4000)
    }
    onDownloadProgess = async ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        let perc = (totalBytesWritten * 100) / totalBytesExpectedToWrite;
        console.log(perc.toFixed(2) + '%')
    }
    onShare = async () => {
        try {
            // const callback = ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
            //     let perc = (totalBytesWritten * 100) / totalBytesExpectedToWrite;
            //     console.log(perc.toFixed(2) + '%')
            //     // this.setState({
            //     //     downloadProgress: progress,
            //     // });
            // };

            // const downloadResumable = FileSystem.createDownloadResumable(
            //     'http://techslides.com/demos/sample-videos/small.mp4',
            //     FileSystem.documentDirectory + 'small.mp4',
            //     {},
            //     callback
            // );

            // const { uri } = await downloadResumable.downloadAsync();
            // console.log('Finished downloading to ', uri);

            try {
                let shareResult = await Sharing.shareAsync(
                    // 'file:///data/user/0/host.exp.exponent/files/ExperienceData/%2540sardarwaseemjaved%252FAKEntertainment/small.mp4',
                    'file:///var/mobile/Containers/Data/Application/8B7736C2-9D9E-4555-B23A-57770D6E8554/Documents/ExponentExperienceData/%2540sardarwaseemjaved%252FAKEntertainment/small.mp4',
                    { dialogTitle: 'AK Entertainment Test' }
                )
                // let shareResult = await Share.share(
                //     { url: 'file:///var/mobile/Containers/Data/Application/8B7736C2-9D9E-4555-B23A-57770D6E8554/Documents/ExponentExperienceData/%2540sardarwaseemjaved%252FAKEntertainment/small.mp4',
                // },
                //     { dialogTitle: 'AK Entertainment Test' }
                // )
                console.log('shareResult:', shareResult)
                // if (shareResult.action === Share.sharedAction) {
                //     if (shareResult.activityType) {
                //         console.log('Shared with activity type of :', shareResult.activityType)
                //     } else {
                //         console.log('Shared');
                //     }
                // } else if (shareResult.action === Share.dismissedAction) {
                //     console.log('Sharing Dismissed');
                // }
            } catch (error) {
                console.log('Sharing Error:', error)
            }


            // try {
            //     await downloadResumable.pauseAsync();
            //     console.log('Paused download operation, saving for future retrieval');
            //     AsyncStorage.setItem('pausedDownload', JSON.stringify(downloadResumable.savable()));
            // } catch (e) {
            //     console.error(e);
            // }

            // try {
            //     const { uri } = await downloadResumable.resumeAsync();
            //     console.log('Finished downloading to ', uri);
            // } catch (e) {
            //     console.error(e);
            // }

            //To resume a download across app restarts, assuming the the DownloadResumable.savable() object was stored:
            // const downloadSnapshotJson = await AsyncStorage.getItem('pausedDownload');
            // const downloadSnapshot = JSON.parse(downloadSnapshotJson);
            // const downloadResumable = new FileSystem.DownloadResumable(
            //     downloadSnapshot.url,
            //     downloadSnapshot.fileUri,
            //     downloadSnapshot.options,
            //     callback,
            //     downloadSnapshot.resumeData
            // );

            // try {
            //     const { uri } = await downloadResumable.resumeAsync();
            //     console.log('Finished downloading to ', uri);
            // } catch (e) {
            //     console.error(e);
            // }
            // onShare = async () => {
            //     try {
            //         const image_source = 'https://images.unsplash.com/photo-1508138221679-760a23a2285b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&w=1000&q=80';

            //         FileSystem.createDownloadResumable(
            //             image_source,
            //             FileSystem.documentDirectory + 'abc.jpeg',
            //             { md5: false },
            //             this.onDownloadProgess,
            //             null
            //         )
            // FileSystem.downloadAsync(
            //     image_source,
            //     FileSystem.documentDirectory + 'abc.jpeg'
            //     // FileSystem.documentDirectory + this.props.playlist[this.index].id + new Date() + '.jpeg'
            // )
            //     .then(({ uri }) => {
            //         // .then(({ uri }) => { 
            //         console.log('Finished downloading to ', uri);
            //         Share.share({ url: uri });
            //     })
            //     .catch(error => {
            //         console.error(error);
            //     });



            // console.log(this.props.playlist[this.index])
            // const result = await Share.share({
            //     url: this.props.playlist[this.index].url,
            //     type: 'video',
            //     // message: this.props.playlist[this.index].url,
            // });

            // if (result.action === Share.sharedAction) {
            //     if (result.activityType) {
            //         // shared with activity type of result.activityType
            //     } else {
            //         // shared
            //     }
            // } else if (result.action === Share.dismissedAction) {
            //     // dismissed
            // }
        } catch (error) {
            alert(error.message);
        }
    };
    _renderVideoList({ item, index }, parallaxProps) {
        return (
            <TouchableOpacity
                onPress={() => this._changeCurrentVideoToIndex(index)}
                style={styles.item}
            >
                <Image
                    resizeMode='stretch'
                    // source={require('./../../../assets/videoIcons/bomb.png')}
                    // source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcQMBxZD1ft1yQPsq18NCOocenVLmz_IqmggICg9-PmPU8cc8Z3w' }}

                    source={{ uri: item.thumbnail }}
                    containerStyle={styles.imageContainer}
                    style={styles.image}
                    parallaxFactor={0}
                    {...parallaxProps}
                />
                {/* <ParallaxImage
                    resizeMode='center'
                    source={{ uri: item.thumbnail }}
                    containerStyle={styles.imageContainer}
                    style={styles.image}
                    parallaxFactor={0}
                    {...parallaxProps}
                /> */}
                <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                </Text>
            </TouchableOpacity>
        );
        // <TouchableOpacity
        //     onPress={() => this._changeCurrentVideoToIndex(VideoNumber)}
        //     style={{
        //         alignItems: 'center', justifyContent: 'center',
        //         width: DEVICE_WIDTH / 4, height: DEVICE_WIDTH / 4,
        //         margin: 5, backgroundColor: 'black', borderRadius: 10
        //     }}
        //     key={VideoNumber}
        // >
        //     <Image source={{ uri: currentVideo.thumbnail }}
        //         style={[{ position: 'absolute', width: DEVICE_WIDTH / 4, height: DEVICE_WIDTH / 4, backgroundColor: 'black', borderRadius: 10 }]}
        //     />
        //     {VideoNumber == this.index &&
        //         <>
        //             <View
        //                 style={{
        //                     alignItems: 'center', justifyContent: 'center', position: 'absolute',
        //                     width: DEVICE_WIDTH / 4, height: DEVICE_WIDTH / 4,
        //                     backgroundColor: 'black', borderRadius: 10, opacity: 0.75
        //                 }}
        //             />
        //             <Text adjustsFontSizeToFit style={{ color: '#F5DB57' }}>Now playing...</Text>
        //         </>
        //     }
        // </TouchableOpacity>
    }
    onBombPress = async () => {
        try {
            let { videoLikedBy } = this.state;
            let videoId = this.props.playlist[this.index].id,
                userId = this.props.navigation.getParam('user')?.uid;
            console.log('videoLikedBy', videoLikedBy, 'userId:' + userId)
            if (videoLikedBy?.includes(userId)) {
                api.updateVideoLikesCounter(videoId, userId, 'removeLike')
                videoLikedBy.splice(videoLikedBy.indexOf(userId), 1)
                this.setState({ videoLikedBy: videoLikedBy })
            }
            else {
                api.updateVideoLikesCounter(videoId, userId, 'addLike')
                videoLikedBy.push(userId)
                this.setState({ videoLikedBy: videoLikedBy })
            }
        } catch (error) {
            console.log('Bomb Error:', error)
        }
    }
    donwloadFile = async () => {
        try {
            console.log(this.props.playlist[this.index].url)
            Linking.openURL(this.props.playlist[this.index].url);
            // alert(FileSystem.documentDirectory)
        } catch (error) {
            console.log('donwloadFile error:', error)
        }
        // FileSystem.downloadAsync(
        //     'http://techslides.com/demos/sample-videos/small.mp4',
        //     FileSystem.documentDirectory + 'small.mp4'
        //   )
        //     .then(({ uri }) => {
        //       console.log('Finished downloading to ', uri);
        //     })
        //     .catch(error => {
        //       console.error(error);
        //     });
    }

    render() {
        const { videoLikedBy } = this.state;
        return (

            <View style={styles.container}>
                <ImageBackground style={styles.titleSliderContainerImage} source={require('./../../../assets/images/loginScreen.jpg')}>

                    <StatusBar hidden={true} />

                    {/* /////////////////////////////  VIDEO CONTAINER  /////////////////////////////////// */}
                    <View style={[styles.videoContainer, { position: 'absolute' }]}>
                        <Video
                            ref={this._mountVideo}
                            style={[
                                styles.video,
                                {
                                    width: this.state.videoWidth,
                                    height: this.state.videoHeight == DEVICE_HEIGHT ?
                                        (39.7 * DEVICE_HEIGHT) / 100 :
                                        this.state.videoHeight,
                                    // width: this.state.videoWidth,
                                    // height: this.state.videoHeight
                                }
                            ]}
                            shouldPlay={false}
                            resizeMode={Video.RESIZE_MODE_CONTAIN}
                            onPlaybackStatusUpdate={this._onPlaybackStatusUpdate}
                            onLoadStart={this._onLoadStart}
                            onLoad={this._onLoad}
                            onError={this._onError}
                            onFullscreenUpdate={this._onFullscreenUpdate}
                            onReadyForDisplay={this._onReadyForDisplay}
                        // useNativeControls={false}
                        // useNativeControls={this.state.useNativeControls}
                        />
                    </View>

                    {/* /////////////////////////////  VIDEO BUTTONS CONTAINER  /////////////////////////////////// */}

                    <View
                        style={[
                            styles.video,
                            {
                                // backgroundColor:ThemeColors.highlightsColor,
                                width: this.state.videoWidth,
                                height: this.state.videoHeight == DEVICE_HEIGHT ?
                                    (39.7 * DEVICE_HEIGHT) / 100 :
                                    this.state.videoHeight,
                            }
                        ]} >
                        <View style={styles.flex1} onPress={this.showPlayerControls}>
                            {!this.state.fontLoaded ?
                                <ActivityIndicator color={ThemeColors.primaryColor} size={'large'} style={styles.loadingIndicator} />
                                :
                                <>
                                    {!this.state.showPlayerControls && this.state.isPlaying
                                        ?
                                        <TouchableOpacity onPress={this.showPlayerControls} style={styles.videoOverlayTouch} />
                                        :
                                        <View style={styles.videoBackground}>
                                            <TouchableOpacity activeOpacity={1} onPress={this.showPlayerControls}
                                                style={[styles.videoOverlayContainer]}>

                                                <View style={styles.videoOverlayCol1}                                                    >
                                                    <TouchableOpacity
                                                        onPress={this._onPlayPausePressed}
                                                        style={[styles.playPauseButton]}
                                                        disabled={this.state.isLoading}
                                                    >
                                                        <Image
                                                            resizeMode='contain'
                                                            style={[styles.playPauseButton]}
                                                            source={
                                                                this.state.isPlaying
                                                                    ? require('./../../../assets/videoIcons/pause.png')
                                                                    : require('./../../../assets/videoIcons/play.png')
                                                            }
                                                        />
                                                    </TouchableOpacity>

                                                </View>
                                                <View style={styles.videoControlsRow}>
                                                    <Icon
                                                        onPress={this._onMutePressed}
                                                        style={[styles.nowPlayingIcon, styles.fullscreenIcon]}
                                                        name={this.state.muted ? 'volume-mute' : 'volume-high'}
                                                        type='MaterialCommunityIcons'
                                                    />
                                                    <Icon
                                                        onPress={this._onFullscreenPressed}
                                                        style={[styles.nowPlayingIcon, styles.fullscreenIcon]}
                                                        name='fullscreen'
                                                        type='MaterialCommunityIcons'
                                                    />
                                                </View>
                                            </TouchableOpacity>
                                            <View style={{ position: 'absolute', bottom: 0, left: 0, flex: 1, width: DEVICE_WIDTH }}>
                                                <CustomSlider
                                                    maximumTrackTintColor={ThemeColors.primaryColorRgba + '0.2)'}
                                                    minimumTrackTintColor={ThemeColors.primaryColor}
                                                    value={this._getSeekSliderPosition()}
                                                    onValueChange={this._onSeekSliderValueChange}
                                                    onSlidingComplete={this._onSeekSliderSlidingComplete}
                                                    disabled={this.state.isLoading}
                                                    // style={{paddingTop:0, backgroundColor:'green'}}
                                                    trackStyle={styles.track}
                                                    thumbStyle={[styles.thumb,
                                                    // (!this.state.showPlayerControls && (!this._getTimestamp().split('/')[0] || this._getTimestamp().split('/')[0].includes('00:00'))) ||
                                                    // (!this.state.showPlayerControls && this.state.isPlaying)
                                                    // && 
                                                    // { opacity: 0 }
                                                    ]}
                                                />
                                            </View>

                                            <View style={styles.timeContainer}>
                                                <Text style={styles.nowPlayingLabel}>{this._getTimestamp().split('/')[0]}</Text>
                                                <View style={styles.flex1} />
                                                <Text style={styles.nowPlayingLabel}>{this._getTimestamp().split('/')[1]}</Text>
                                            </View>
                                        </View>
                                    }
                                </>
                            }
                        </View>
                    </View>
                    <View
                    // style={styles.titleSliderContainer}
                    >
                        {/* <View style={{ position: 'absolute', top: 0, left: 0, flex: 1, width: DEVICE_WIDTH }}>
                            <CustomSlider
                                maximumTrackTintColor={ThemeColors.primaryColorRgba + '0.2)'}
                                minimumTrackTintColor={ThemeColors.primaryColor}
                                value={this._getSeekSliderPosition()}
                                onValueChange={this._onSeekSliderValueChange}
                                onSlidingComplete={this._onSeekSliderSlidingComplete}
                                disabled={this.state.isLoading}
                                // style={{paddingTop:0, backgroundColor:'green'}}
                                trackStyle={styles.track}
                                thumbStyle={[styles.thumb,
                                // (!this.state.showPlayerControls && (!this._getTimestamp().split('/')[0] || this._getTimestamp().split('/')[0].includes('00:00'))) ||
                                // (!this.state.showPlayerControls && this.state.isPlaying)
                                // && 
                                { opacity: 0 }
                                ]}
                            />
                        </View>

                        <View style={styles.timeContainer}>
                            <Text style={styles.nowPlayingLabel}>{this._getTimestamp().split('/')[0]}</Text>
                            <View style={styles.flex1} />
                            <Text style={styles.nowPlayingLabel}>{this._getTimestamp().split('/')[1]}</Text>
                        </View> */}
                        <View style={styles.nowPlayingRow}>
                            <Image
                                resizeMode='cover'
                                style={styles.currentVideoThumb}
                                source={{ uri: this.state.PLAYLIST[this.index].thumbnail }}
                            />
                            <View style={[styles.videoMetaContainer]}>
                                <Text numberOfLines={1} style={[styles.nowPlayingLabel, styles.videoTitle]}>
                                    <Icon type='MaterialCommunityIcons' name='filmstrip' style={styles.starIcon} />
                                    {' '}{this.state.PLAYLIST[this.index].name}
                                </Text>
                                <Text numberOfLines={1} style={[styles.nowPlayingLabel, styles.videoMeta]}>
                                    <Icon type='MaterialCommunityIcons' name='calendar' style={styles.starIcon} />
                                    {' '}20 Jan 2018
                                </Text>
                                <Text numberOfLines={1} style={[styles.nowPlayingLabel, styles.videoMeta]}>
                                    <Icon type='MaterialCommunityIcons' name='star-circle-outline' style={styles.starIcon} />
                                    {' '}Waseem Javed, Adnan Altaf, Kashan Khan
                                </Text>
                            </View>

                        </View>

                    </View>
                    {/* <View style={styles.row}>

                        <TouchableOpacity
                            onPress={this.onShare}
                        // onPress={this._onPlayPausePressed}
                        >
                            <Image
                                style={[styles.actionButton]}
                                source={require('./../../../assets/videoIcons/share.png')}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            // style={{ marginTop: 10 }}
                            onPress={this.donwloadFile}
                        >
                            <Image
                                style={[styles.actionButton]}
                                source={require('./../../../assets/videoIcons/download.png')}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            // style={{ marginTop: 10 }}
                            onPress={this.onBombPress}
                        >
                            <Image
                                style={[styles.actionButton, {
                                    opacity: videoLikedBy?.includes(this.props.navigation.getParam('user')?.uid) ? 1 : 0.5
                                }]}
                                source={require('./../../../assets/videoIcons/bomb.png')}
                            />
                        </TouchableOpacity>
                    </View> */}

                    {/* /////////////////////////////  VIDEO List CONTAINER /////////////////////////////////// */}

                    <View style={styles.videoListContainer}>
                        <FlatList
                            columnWrapperStyle={styles.columnWrapperStyle}
                            keyExtractor={(item, index) => index}
                            numColumns={3}
                            renderItem={this.renderVideoListItem}
                            data={this.props.playlist}
                            contentContainerStyle={styles.videoListContentContainer}
                        />
                    </View>

                </ImageBackground>
            </View >
        );
    }
    renderVideoListItem = ({ item, index }) => {
        return (
            <View style={styles.videoListItem}>
                <TouchableOpacity onPress={() => this._changeCurrentVideoToIndex(index)}                 >
                    <Image
                        resizeMode='cover'
                        source={{ uri: item.thumbnail }}
                        style={styles.videoListItem}
                    />
                    <View style={[styles.videoListItem, styles.itemOverlay]} />
                </TouchableOpacity>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    videoControlsRow: {
        flexDirection: 'row',
        marginHorizontal: 5,
        alignSelf: 'flex-end',
    },
    columnWrapperStyle: {
        flex: 1,
        justifyContent: 'space-evenly',
        paddingVertical: 5
    },
    starIcon: {
        color: ThemeColors.primaryColor,
        fontSize: 10,
    },
    videoMetaContainer: {
        flex: 1,
        justifyContent: 'center'
    },
    currentVideoThumb: {
        width: 50,
        height: 50,
        borderRadius: 50,
        backgroundColor: ThemeColors.highlightsColorRgba + '0.1)'
    },
    track: {
        height: 8,
        borderRadius: 0,
        // backgroundColor: 'transparent',
        borderColor: ThemeColors.primaryColorRgba + '0.5)',
        backgroundColor: ThemeColors.highlightsColorRgba + '0.5)',
        // borderWidth: 0.5,
        // borderRightWidth:0
    },
    thumb: {
        // elevation: 1,
        // shadowColor: ThemeColors.highlightsColor,
        // shadowOffset: { width: 0, height: 1 },
        // shadowOpacity: 0.8,
        // shadowRadius: 1,
        width: 8,
        height: 8,
        borderRadius: 2,
        backgroundColor: ThemeColors.primaryColor,
        borderColor: ThemeColors.primaryColor,
        borderWidth: 1,
    },
    videoOverlayContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        paddingTop: 30,
        backgroundColor: ThemeColors.highlightsColorRgba + '0.5)',
    },
    videoBackground: {
        flex: 1,
        // backgroundColor: ThemeColors.highlightsColor,
        // backgroundColor: ThemeColors.highlightsColorRgba + '0.5)',
    },
    row: {
        flexDirection: 'row'
    },
    flex1: {
        flex: 1
    },
    fullscreenIcon: {
        fontSize: 25
    },
    nowPlayingIcon: {
        color: ThemeColors.primaryColor,
        fontSize: 17,
        // transform: [{ rotate: '90deg' }]
    },
    nowPlayingRow: {
        flexDirection: 'row',
        backgroundColor: ThemeColors.highlightsColorRgba + '1)',
        paddingVertical: 5,
        marginTop: 2.5,
        // alignItems: 'center',
        // justifyContent: 'space-between',
        paddingRight: 1.5
    },

    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    titleSliderContainerImage: {
        backgroundColor: ThemeColors.highlightsColor,
        width: DEVICE_WIDTH,
        flex: 1
    },
    titleSliderContainer: {
        // elevation: 1,
        // shadowColor: ThemeColors.highlightsColor,
        // shadowOffset: { width: 0, height: -1 },
        // shadowOpacity: 0.8,
        // shadowRadius: 1,
        backgroundColor: ThemeColors.highlightsColor,
        // paddingVertical: 5,
        // marginVertical: 1,
        // paddingHorizontal: 20,
        // borderBottomLeftRadius: 20,
        // borderBottomRightRadius: 20,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 8,
        width: DEVICE_WIDTH,
        // marginTop: 2,
        // backgroundColor: ThemeColors.highlightsColorRgba + '0.3)',
        // marginHorizontal: 10
    },
    nowPlayingLabel: {
        elevation: 1,
        color: ThemeColors.primaryColor,
        fontSize: 6,
        marginHorizontal: 5,
        textShadowColor: ThemeColors.highlightsColor,
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
        textAlignVertical: 'center'
    },
    videoMeta: {
        color: ThemeColors.primaryColor,
        fontSize: 10,
    },
    videoTitle: {
        color: ThemeColors.primaryColor,
        fontWeight: 'bold',
        fontSize: 12,
    },
    actionButtonContainer: {
        justifyContent: 'center',
    },
    actionButton: {
        width: (12 * DEVICE_WIDTH) / 100,
        height: (12 * DEVICE_WIDTH) / 100,
        marginLeft: 5,
        backgroundColor: ThemeColors.primaryColor,
        borderRadius: 50
    },
    playPauseButton:
    {
        tintColor: ThemeColors.primaryColor,
        flex: 1,
        width: (18.67 * DEVICE_WIDTH) / 100,
        height: (18.67 * DEVICE_WIDTH) / 100
    },
    videoOverlayTouch: {
        flex: 1,
        alignItems: 'center'
    },
    loadingIndicator: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    videoOverlayCol1: {
        // flex: 1,
        // marginRight: 10,
        justifyContent: 'center'
    },
    itemOverlay: {
        backgroundColor: ThemeColors.highlightsColor,
        opacity: 0.5,
        position: 'absolute',
        top: 0,
        left: 0
    },
    videoListContentContainer: {
        // paddingTop: 40,
        // paddingBottom: 20
    },
    videoListItem: {
        shadowRadius: 2,
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowColor: ThemeColors.highlightsColor,
        elevation: 0.1,
        shadowOpacity: 0.1,
        width: (DEVICE_WIDTH / 3.3),
        height: (DEVICE_WIDTH / 3.3),
        backgroundColor: ThemeColors.backgroundColor,
        marginBottom: 5,
        borderRadius: 10,
        // height: 100,
        // borderColor: ThemeColors.secondaryColor,
        // borderWidth: 0.5
    },
    videoListContainer: {
        flex: 1,
        // backgroundColor: ThemeColors.highlightsColor
    },
    item: {
        shadowRadius: 2,
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowColor: 'rgba(0,0,0,1)',
        elevation: 0.1,
        shadowOpacity: 0.1,
        // marginLeft: 3,
        borderRadius: 15,
        overflow: 'hidden',
        width: (DEVICE_WIDTH / 3),
        height: (DEVICE_WIDTH / 3),
        borderWidth: 1, color: ThemeColors.secondaryColor,
    },
    imageContainer: {
        flex: 1,
        marginBottom: Platform.select({ ios: 0, android: 1 }), // Prevent a random Android rendering issue
        // backgroundColor: 'black',
        borderRadius: 8,
    },
    image: {
        width: (DEVICE_WIDTH / 3),
        height: (DEVICE_WIDTH / 3),
        backgroundColor: ThemeColors.backgroundColor,
        // ...StyleSheet.absoluteFillObject,
        // resizeMode: 'stretch',
        // backgroundColor: 'green'
    },

    emptyContainer: {
        alignSelf: "stretch",
        backgroundColor: BACKGROUND_COLOR
    },
    container: {
        flex: 1,
        // backgroundColor: ThemeColors.highlightsColor
        backgroundColor: ThemeColors.backgroundColor
    },
    wrapper: {},
    nameContainer: {
        height: FONT_SIZE
    },
    space: {
        height: FONT_SIZE
    },
    videoContainer: {
        // height: VIDEO_CONTAINER_HEIGHT,
        height: DEVICE_HEIGHT,
        width: DEVICE_WIDTH,
        // backgroundColor: 'red'
    },
    video: {
        maxWidth: DEVICE_WIDTH
    },
    playbackContainer: {
        flex: 1,
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        alignSelf: "stretch",
        minHeight: ICON_THUMB_1.height * 2.0,
        maxHeight: ICON_THUMB_1.height * 2.0
    },
    playbackSlider: {
        alignSelf: "stretch"
    },
    timestampRow: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        alignSelf: "stretch",
        minHeight: FONT_SIZE
    },
    text: {
        fontSize: FONT_SIZE,
        minHeight: FONT_SIZE
    },
    buffering: {
        textAlign: "left",
        paddingLeft: 20
    },
    timestamp: {
        textAlign: "right",
        paddingRight: 20
    },
    button: {
        backgroundColor: BACKGROUND_COLOR
    },
    buttonsContainerBase: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    buttonsContainerTopRow: {
        maxHeight: ICON_PLAY_BUTTON.height,
        minWidth: DEVICE_WIDTH / 2.0,
        maxWidth: DEVICE_WIDTH / 2.0
    },
    buttonsContainerMiddleRow: {
        maxHeight: ICON_MUTED_BUTTON.height,
        alignSelf: "stretch",
        paddingRight: 20
    },
    volumeContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        minWidth: DEVICE_WIDTH / 2.0,
        maxWidth: DEVICE_WIDTH / 2.0
    },
    volumeSlider: {
        width: DEVICE_WIDTH / 2.0 - ICON_MUTED_BUTTON.width
    },
    buttonsContainerBottomRow: {
        maxHeight: ICON_THUMB_1.height,
        alignSelf: "stretch",
        paddingRight: 20,
        paddingLeft: 20
    },
    rateSlider: {
        width: DEVICE_WIDTH / 2.0
    },
    buttonsContainerTextRow: {
        maxHeight: FONT_SIZE,
        alignItems: "center",
        paddingRight: 20,
        paddingLeft: 20,
        minWidth: DEVICE_WIDTH,
        maxWidth: DEVICE_WIDTH
    },
    wrapper: {},
    slide1: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: '#9DD6EB'
    },
    slide2: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#97CAE5'
    },
    slide3: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#92BBD9'
    },
    // text: {
    //     color: '#fff',
    //     fontSize: 30,
    //     fontWeight: 'bold'
    // }
});

                                                                    // import React from 'react';
// import {
//     View, StyleSheet, TouchableHighlight, Text, Image, Dimensions,
//     ActivityIndicator, ScrollView, TouchableOpacity, Slider
// } from 'react-native';
// import * as VideoThumbnails from 'expo-video-thumbnails';
// import { Video } from 'expo-av'
// import VideoPlayer from 'expo-video-player'
// import * as firebase from 'firebase'

// import Swiper from 'react-native-swiper';
// import { ScreenOrientation } from 'expo';
// import { Row } from './Row';
// import { Icon } from 'native-base';

// const { width, height } = Dimensions.get('window')

// export default class CustomPlayer extends React.Component {
//     constructor(props) {
//         super(props);
//         this.state = {
//             isFullScreen: false,
//             isVideoLoading: false,
//             currentVideoIndex: 0,
//             videoPlaybackPosition: 0,
//             videos: [],
//             isLoading: true,
//             playableDurationMillis: 0,
//             positionMillis: 0,
//             isPlaying: true
//         }
//     }

//     componentDidUpdate(prevProps, prevState) {
//         if (prevProps.source.uri != this.props.source.uri) {
//             console.log('prevProps.source.uri', prevProps.source.uri, ' this.props.source.uri', this.props.source.uri)
//             this.videoRef = null;
//             this.setState({
//                 isFullScreen: false,
//                 isVideoLoading: false,
//                 currentVideoIndex: 0,
//                 videoPlaybackPosition: 0,
//                 videos: [],
//                 isLoading: true,
//                 playableDurationMillis: 0,
//                 positionMillis: 0,
//                 isPlaying: true
//             });
//         }
//     }
//     setVideoRef(e) {
//         this.videoRef = e;
//     }
//     setPlaybackPosition(e) {
//         const { playableDurationMillis, positionMillis } = e;
//         this.setState({ playableDurationMillis, positionMillis })
//     }
//     forceUpdatePlaybackPosition(positionMillis) {
//         this.videoRef.setPositionAsync(positionMillis)
//     }
//     playPauseToggle() {
//         if (this.state.isPlaying) {
//             this.videoRef.pauseAsync();
//             this.setState({ isPlaying: false })
//             return false;
//         }
//         this.videoRef.playAsync()
//         this.setState({ isPlaying: true })
//     }
//     fullscreenToggle() {
//         if (this.state.isFullScreen) {
//             this.videoRef.dismissFullscreenPlayer();
//             this.setState({ isFullScreen: false })
//             return false;
//         }
//         this.videoRef.presentFullscreenPlayer()
//         this.setState({ isFullScreen: true })
//     }
//     render() { 
//         return (
//             <View>
//                 <Video
//                     useNativeControls={false}
//                     onPlaybackStatusUpdate={this.setPlaybackPosition.bind(this)}
//                     ref={this.setVideoRef.bind(this)}
//                     resizeMode='contain'
//                     style={{ width: width, height: 300 }}
//                     // shouldPlay
//                     source={{ uri: this.props.source.uri }}
//                 />
//                 <Row>
//                     <Icon type='MaterialCommunityIcons'
//                         onPress={this.fullscreenToggle.bind(this)}
//                         style={{ color: 'white' }}
//                         name={!this.state.isFullScreen ? 'fullscreen' : 'fullscreen-exit'} />
//                     <Icon type='MaterialCommunityIcons'
//                         onPress={this.playPauseToggle.bind(this)}
//                         style={{ color: 'white' }}
//                         name={!this.state.isPlaying ? 'play-circle-outline' : 'pause-circle-outline'} />
//                 </Row>
//                 <Slider
//                     onValueChange={this.forceUpdatePlaybackPosition.bind(this)}
//                     style={{ width: 200, height: 40 }}
//                     minimumValue={0}
//                     value={this.state.positionMillis}
//                     maximumValue={this.state.playableDurationMillis}
//                     minimumTrackTintColor="#FFFFFF"
//                     maximumTrackTintColor="#000000" />
//             </View>
//         )
//     }
// }