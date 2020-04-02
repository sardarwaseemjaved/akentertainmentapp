import React from 'react';
import {
    View, StyleSheet, TouchableHighlight, Text, Image, Dimensions,
    ActivityIndicator, ScrollView, TouchableOpacity, Slider, StatusBar
} from 'react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Video } from 'expo-av'
import VideoPlayer from 'expo-video-player'
import * as firebase from 'firebase'
import Wrapper from './Wrapper';
import CustomPlayer from './../shared/CustomPlayer'
import api from './../../api';
import Swiper from 'react-native-swiper';
import { ScreenOrientation } from 'expo';
import { setVideos, getVideos } from './../../helpers/asyncStorage'
import { Icon } from 'native-base';
// import { GestureHandler } from 'expo';
// const { Swipeable } = GestureHandler; 
const { width, height } = Dimensions.get('window')


// var videoUrls = [
//     "https://firebasestorage.googleapis.com/v0/b/ak-entertainment.appspot.com/o/akVideos%2Fy2mate.com%20-%20funny_chacha_chaknari_Yu1eFf3AARo_360p.mp4?alt=media&token=9ada0cd5-ee9f-4623-bc96-ec5b4662628e",
//     ,
//     "https://firebasestorage.googleapis.com/v0/b/ak-entertainment.appspot.com/o/akVideos%2Fy2mate.com%20-%20watch_bagh_azad_kashmir_funny_chacha_jammu_kashmir_dot_tv_episodes_blip_jcJlC-ru88U_360p.mp4?alt=media&token=95473ab2-acdd-4f08-9944-a585d93135fe",
// ]


export default class VideosList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isFullScreen: false,
            isVideoLoading: false,
            currentVideoIndex: 0,
            videoPlaybackPosition: 0,
            // videos: [{ thumbnail: 'https://pbs.twimg.com/profile_images/684200142245904384/a124QTD5_400x400.jpg', url: 'https://drive.google.com/uc?export=download&id=1HOMRp8U3W35uq6wuAhtXz8fK1SpxrdNR' }],
            videos: [],
            isLoading: true,
        }
        // this.toggleFullScreen = this.toggleFullScreen.bind(this);
    }
    // componentDidMount() {
    //     videoUrls.map(async (url) => {
    //         try {
    //             const { uri } = await VideoThumbnails.getThumbnailAsync(url, { compress: 0 });
    //             this.state.videos.push({ thumbnail: uri, url: url })
    //             await this.setState({ videos: this.state.videos, isLoading: false })
    //         } catch (e) {
    //             this.setState({ isLoading: false })
    //             console.log('VideoThumbnails Error:', e);
    //         }
    //     })
    // }

    // componentDidMount() {
    //     // Get a reference to the storage service, which is used to create references in your storage bucket
    //     var storage = firebase.storage();

    //     // Create a storage reference from our storage service
    //     var storageRef = storage.ref();

    //     // Create a reference under which you want to list
    //     var listRef = storageRef.child('akVideos');
    //     // var listRef = storageRef;

    //     // Find all the prefixes and items.
    //     listRef.listAll().then(async function (res) {
    //         res.prefixes.forEach(async function (folderRef) {
    //             // All the prefixes under listRef.
    //             // You may call listAll() recursively on them.
    //         });
    //         res.items.forEach(async function (itemRef) {
    //             // All the items under listRef. 
    //             // itemRef.getMetadata().then(function (metaData) {
    //             //   // TODO: Display the image on the UI
    //             //   console.log('metaData', metaData)
    //             // }).catch(function (error) {
    //             //   // Handle any errors
    //             // });
    //             itemRef.getDownloadURL().then(async function (url) {
    //                 // TODO: Display the image on the UI  
    //                 // this.state.videos.push(url)
    //                 try {
    //                     const { uri } = await VideoThumbnails.getThumbnailAsync(
    //                         url, {
    //                         compress: 0
    //                     }
    //                         // {
    //                         //   time: 15000,
    //                         // }
    //                     );
    //                     this.state.videos.push({ thumbnail: uri, url: url })
    //                     await this.setState({ videos: this.state.videos, isLoading: false })
    //                 } catch (e) {
    //                     this.setState({ isLoading: false })
    //                     console.log('VideoThumbnails Error:', e);
    //                 }
    //             }.bind(this))
    //         }.bind(this));
    //     }.bind(this))
    //         .catch(function (error) {
    //             this.setState({ isLoading: false })
    //             // Uh-oh, an error occurred!
    //             console.error(error.message)
    //         });
    // }
    getVideosFromDB = async () => {
        api.getVideos()
            .then(async videosList => {
                console.log('\n\n-----------------GOT VIDEOS LIST:\n', videosList)
                // videosList.map(async thisVideo => {
                //     if (!this.state.videos.find((element) => element.id == thisVideo.id && element.url == thisVideo.url))
                //          this.state.videos.push({
                //         thumbnail: thisVideo.thumbnail,
                //         url: thisVideo.url,
                //         name: thisVideo.name,
                //         id: thisVideo.id
                //     })
                //     setVideos(this.state.videos)
                //     console.log('this.state.videos', this.state.videos)
                //     await this.setState({ videos: this.state.videos, isLoading: false })
                // })
                // setVideos([])
                 
                // videosList.push(
                //     {
                //         thumbnail: 'https://pbs.twimg.com/profile_images/684200142245904384/a124QTD5_400x400.jpg',
                //         url: 'file:///data/user/0/host.exp.exponent/files/ExperienceData/%2540sardarwaseemjaved%252FAKEntertainment/small.mp4',
                //         name: 'Small.mp4',
                //         id: 'small-local-test'
                //     },
                //     {
                //         thumbnail: 'https://pbs.twimg.com/profile_images/684200142245904384/a124QTD5_400x400.jpg',
                //         url: 'file:///var/mobile/Containers/Data/Application/8B7736C2-9D9E-4555-B23A-57770D6E8554/Documents/ExponentExperienceData/%2540sardarwaseemjaved%252FAKEntertainment/small.mp4',
                //         name: 'Small-ios.mp4',
                //         id: 'small-local-test-ios'
                //     },
                // )
                setVideos(videosList)
                console.log('this.state.videos', videosList)
                await this.setState({ videos: videosList, isLoading: false })

            })
            .catch(err => console.log('\n\n----------------GET VIDEO ERROR:\n', err))
        // var storage = firebase.storage();
        // var storageRef = storage.ref();
        // var listRef = storageRef.child('akVideos');
        // listRef.listAll()
        //     .then(async function (res) {
        //         res.items.forEach(async function (itemRef) {
        //             itemRef.getDownloadURL().then(async function (url) {
        //                 const { uri } = await VideoThumbnails.getThumbnailAsync(
        //                     url, {
        //                     compress: 0
        //                 });
        //                 if (!this.state.videos.find((element) => element.url == url))
        //                     this.state.videos.push({ thumbnail: uri, url: url })
        //                 setVideos(this.state.videos)
        //                 await this.setState({ videos: this.state.videos, isLoading: false })
        //             }.bind(this))
        //         }.bind(this));
        //     }.bind(this))
        //     .catch(function (error) {
        //         this.setState({ isLoading: false })
        //         console.error(error.message)
        //     });
    }
    getLocalVideosList = async () => {
        // this.state.videos.push({ thumbnail: 'https://pbs.twimg.com/profile_images/684200142245904384/a124QTD5_400x400.jpg', url: 'https://drive.google.com/uc?export=download&id=1HOMRp8U3W35uq6wuAhtXz8fK1SpxrdNR' })
        // await this.setState({ videos: this.state.videos, isLoading: false })
        getVideos()
            .then((videos) => {
                if (videos.length > 0) {
                    console.log(videos)
                    this.setState({ videos, isLoading: false })
                }
                this.getVideosFromDB()
            })
            .catch(function (error) {
                this.setState({ isLoading: false })
                console.error(error.message)
            });
    }
    componentDidMount() {
        this.getLocalVideosList()
    }
    toggleFullScreen = () => {
        // this.vid.presentFullscreenPlayer();
        this.setState({ isFullScreen: !this.state.isFullScreen })
    }
    toggleVideoLoading = () => {
        console.log('Video Loading....')
    }
    changeCurrentVideoToIndex = (currentVideoIndex) => {
        console.log('currentVideoIndex:' + currentVideoIndex)
        this.setState({ currentVideoIndex })
    }
    LeftActions = (progress, dragX) => {

        // alert('left')
    }
    RightActions = (progress, dragX) => {
        // alert('RightActions')
    }
    setVideoRef(e) {
        this.vidRef = e;
    }
    setPlaybackPosition(e) {
        this.vidRef = e;
    }
    static navigationOptions = {
        header: null,
    }
    render() {
        this.vidRef = []
        // if (this.state.isFullScreen) {
        //     return <CustomVideo
        //         changeCurrentVideoToIndex={this.changeCurrentVideoToIndex}
        //         toggleVideoLoading={this.toggleVideoLoading}
        //         toggleFullScreen={this.toggleFullScreen}
        //         style={{ width: width, height: height }}
        //         state={this.state}
        //     />
        // }
        if (this.state.isLoading) {
            return <ActivityIndicator size={'large'} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} />
        }
        return (
            <View style={{ flex: 1, backgroundColor: 'black', paddingTop: StatusBar.currentHeight }} isLoading={this.state.isLoading}>
                {/* <Icon
                    onPress={() => this.props.navigation.goBack()}
                    type='MaterialCommunityIcons'
                    name='chevron-left'
                    style={{ color: '#F5DB57', paddingTop: 10, fontSize: 50 }}
                /> */}
                {
                    this.state.videos.length > 0
                    &&
                    <CustomPlayer
                        navigation={this.props.navigation}
                        playlist={this.state.videos}
                        source={{
                            uri: this.state.videos[this.state.currentVideoIndex].url,
                        }}
                    />

                }
                {/* <ScrollView horizontal>
                    {
                        this.state.videos.map((video, index) => {
                            return <>
                                <TouchableOpacity onPress={() => this.changeCurrentVideoToIndex(index)}>
                                    <Image source={{ uri: video.thumbnail }} style={{ width: 100, height: 100 }} />
                                </TouchableOpacity>
                            </>
                        })
                    }
                </ScrollView> */}
            </View>
        );
    }
}
// const CustomPlayer = (props) => {
//     return <>
//         <Video
//             useNativeControls
//             onPlaybackStatusUpdate={(e) => console.log('status:', e)}
//             ref={props.this.setVideoRef.bind(props.this)}
//             resizeMode='contain'
//             style={{ width: width, height: 300 }}
//             shouldPlay
//             source={{ uri: props.this.state.videos[props.this.state.currentVideoIndex].url }}
//         />
//         <Slider
//             style={{ width: 200, height: 40 }}
//             minimumValue={0}
//             value={props.state.videoPlaybackPosition}
//             maximumValue={1}
//             minimumTrackTintColor="#FFFFFF"
//             maximumTrackTintColor="#000000" />
//     </>
// }
const CustomVideo = (props) => {
    return <>
        {
            props.state.isVideoLoading
                ?
                <ActivityIndicator />
                :
                <Swiper
                    style={styles.wrapper}
                    //  showsButtons
                    removeClippedSubviews={false}
                    dotStyle={styles.dotStyle}
                    onIndexChanged={(index) => props.changeCurrentVideoToIndex(index)}
                    loop={true}
                    activeDotStyle={styles.activeDotStyle}>
                    {
                        props.state.videos.map((video, index) => {
                            return <>
                                {
                                    index == props.state.currentVideoIndex ? <VideoPlayer
                                        switchToLandscape={async () => {
                                            console.log('here1')
                                            // await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
                                            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT)
                                        }}
                                        switchToPortrait={async () => {
                                            console.log('here2')

                                            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)
                                            // await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);

                                        }}

                                        errorCallback={(e) => console.log('VIDEO ERROR:', e)}
                                        width={width}
                                        height={300}
                                        showFullscreenButton
                                        showControlsOnLoad
                                        videoProps={{
                                            shouldPlay: true,
                                            resizeMode: Video.RESIZE_MODE_CONTAIN,
                                            source: {
                                                uri: props.state.videos[props.state.currentVideoIndex].url,
                                                // uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                                            },
                                        }}
                                        inFullscreen={false}
                                    />
                                        :
                                        <TouchableOpacity onPress={() => this.changeCurrentVideoToIndex(index)}>
                                            <Image source={{ uri: video.thumbnail }} style={{ width: width, height: 400 }} />
                                        </TouchableOpacity>
                                }
                            </>
                        })
                    }
                </Swiper>

        }
        {/*
         <VideoPlayer
                videoProps={{
                    shouldPlay: true,
                    resizeMode: Video.RESIZE_MODE_CONTAIN,
                    source: {
                        uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                    },
                }}
                inFullscreen={props.state.isFullScreen}
            />
         {props.state.isVideoLoading
            ?
            <ActivityIndicator />
            : <Video
                onLoadStart={props.videoLoadingToggle}
                onLoad={props.videoLoadingToggle}
                ref={r => this.vid = r}
                // source={{ uri: props.state.videos[props.state.currentVideoIndex].url }}
                source={{ uri: 'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' }}
                rate={1.0}
                volume={1.0}
                muted={false}
                resizeMode="cover"
                repeat
                style={props.style}
            />
            } */}
        <TouchableHighlight style={{ padding: 10, backgroundColor: 'green', borderRadius: 10 }} onPress={props.toggleFullScreen}>
            <Text style={{ color: 'white' }}>Full Screen</Text>
        </TouchableHighlight>
    </>
}
const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor: '#rgba(0,0,0,0.9)',
    },
    dotStyle: {
        backgroundColor: 'rgba(255, 255, 255, 0.48)',
    },
    activeDotStyle: {
        backgroundColor: 'white',
    },
});








