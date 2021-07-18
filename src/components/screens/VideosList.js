import React from 'react';
import {
    View, StyleSheet, TouchableHighlight, Text, Image, Dimensions, FlatList, AsyncStorage,
    ActivityIndicator, ScrollView, TouchableOpacity, Slider, StatusBar, ImageBackground, Modal
} from 'react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Video } from 'expo-av'
import * as firebase from 'firebase'
import Wrapper from './Wrapper';
import CustomPlayer from './../shared/CustomPlayer'
import api from './../../api';
import Swiper from 'react-native-swiper';
import { ScreenOrientation } from 'expo';
import { OverLay } from '../shared'
import { setVideos, getVideos, getVideoDownloadData, setVideoDownloadData } from './../../helpers/asyncStorage'
import { Icon } from 'native-base';
import VideoPlayer from '../shared/VideoPlayer'
import ThemeColors from '../../styles/colors';
import { STATUSBAR_HEIGHT, scaleSize, appFontScale, WINDOW_WIDTH } from '../../helpers/mixin'
import { AppImageIcon, AppIcon } from '../shared/Icon';
import { withNavigationFocus } from 'react-navigation';
import CustomSlider from '../shared/Slider'
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { v4 as uuidv4 } from 'uuid';


const fileExtension = function (url) {
    return url.split('.').pop().split(/\#|\?/)[0];
}
class VideosList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isDownloadModalVisible: false,
            currentVideoIndex: 0,
            videos: [],
            isLoading: true,
        }
    }
    getVideosFromDB = async () => {
        api.getVideos()
            .then(async videosList => {
                console.log('\n\n-----------------GOT VIDEOS LIST:\n', videosList)
                setVideos(videosList)
                console.log('this.state.videos', videosList)
                await this.setState({ videos: videosList, isLoading: false })
            })
            .catch(err => console.log('\n\n----------------GET VIDEO ERROR:\n', err))
    }
    getLocalVideosList = async () => {
        getVideos()
            .then((videos) => {
                if (videos.length > 0) {
                    this.setState({ videos, isLoading: false })
                }
                this.getVideosFromDB()
            })
            .catch(function (error) {
                this.setState({ isLoading: false })
                console.error(error.message)
            });
    }
    handleSharing = async () => {
        try {
            // const { currentVideoDownloadData } = this.state; 
            // const { videos, currentVideoIndex } = this.state
            // let curVidObj = {}
            // if (videos.length)
            //     curVidObj = videos[currentVideoIndex]

            // let localurl = FileSystem.documentDirectory
            // const { exists } = await FileSystem.getInfoAsync(localurl)
            // if (exists) {
            //     FileSystem.deleteAsync(localurl)
            //         .then(e => {
            //             console.log('deleted')
            // this.startFreshDownload()
            //         })
            // }

            const { currentVideoDownloadData } = this.state
            if (!currentVideoDownloadData?.uri) {
                this.toggleDownloadMode()
                return;
            }
            const { videos, currentVideoIndex } = this.state
            let curVidObj = {}
            if (videos.length)
                curVidObj = videos[currentVideoIndex]
            try {
                const { exists } = await FileSystem.getInfoAsync(localurl)
                if (!exists) {
                    console.log('!exist');
                    await this.setState({ currentVideoDownloadData: {} })
                    await setVideoDownloadData(curVidObj.id, JSON.stringify(null))
                    this.toggleDownloadMode()
                    this.startFreshDownload()
                    return 
                }
            } catch (error) {
                console.log('!existerror');
                await this.setState({ currentVideoDownloadData: {} })
                await setVideoDownloadData(curVidObj.id, JSON.stringify(null))
                this.toggleDownloadMode()
                this.startFreshDownload()
                console.log('handleSharing 1:', error)
                return
            }
            if (Sharing.isAvailableAsync()) {
                console.log('curVidObj.url', currentVideoDownloadData?.uri)
                Sharing
                    .shareAsync(currentVideoDownloadData?.uri, {})
                    .catch(e => {
                        this.startFreshDownload()
                        console.log(e)
                    })
            }
            else {
                alert('Sharing not available')
            }
        } catch (error) {
            console.log(error)
            this.toggleDownloadMode()
        }
    }
    downloadProgressCallback = downloadProgress => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        if (progress == 1) {
            const { videos, currentVideoIndex } = this.state
            let curVidObj = {}
            if (videos.length)
                curVidObj = videos[currentVideoIndex]
            // setVideoDownloadData(curVidObj.id, JSON.stringify({ finished: true, uri }))
            this.getCurrentVideoDownloadData()
        }
        let progressNow = { ...this.state.downloadProgress }
        progressNow['a' + this.state.currentVideoIndex] = progress
        this.setState({ downloadProgress: progressNow });
    };

    getCurrentVideoDownloadData = async () => {
        const { videos, currentVideoIndex } = this.state
        let curVidObj = {}
        if (videos.length)
            curVidObj = videos[currentVideoIndex]
        let downloadData = await getVideoDownloadData(curVidObj.id)
        console.log('downloadData:', downloadData)
        this.setState({ currentVideoDownloadData: downloadData })
    }

    onStartDownload = async () => {
        const { currentVideoDownloadData } = this.state;
        if (currentVideoDownloadData !== null && !currentVideoDownloadData.finished)
            this.resumeDownload()
        else
            this.startFreshDownload()
    }
    startFreshDownload = async () => {

        const { currentVideoDownloadData } = this.state;
        // FileSystem.createDownloadResumable(uri, fileUri, options, callback, resumeData)
        const { videos, currentVideoIndex } = this.state
        let curVidObj = {}
        if (videos.length)
            curVidObj = videos[currentVideoIndex]

        try {
            await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'videos')
        }
        catch (e) {
            console.log('FileSystem.makeDirectoryAsync(localurl):', e);
        }
        let localurl = FileSystem.documentDirectory + 'videos/' + curVidObj.id + '.' + (curVidObj.extension ? curVidObj.extension : fileExtension(curVidObj.url))

        console.log('localurl:', localurl)
        const downloadResumable = FileSystem.createDownloadResumable(
            curVidObj.url,
            // 'http://techslides.com/demos/sample-videos/small.mp4',
            localurl,
            {},
            this.downloadProgressCallback
        );

        try {
            const { uri } = await downloadResumable.downloadAsync();
            setVideoDownloadData(curVidObj.id, JSON.stringify({ finished: true, uri }))
            console.log('Finished downloading to ', uri);
        } catch (e) {
            console.error('startFreshDownload:', e);
        }

        // try {
        //     await downloadResumable.pauseAsync();
        //     console.log('Paused download operation, saving for future retrieval');
        //     setVideoDownloadData(curVidObj.id, JSON.stringify(downloadResumable.savable()))
        //     // AsyncStorage.setItem('pausedDownload', JSON.stringify(downloadResumable.savable()));
        // } catch (e) {
        //     console.error(e);
        // }

        // try {
        //     const { uri } = await downloadResumable.resumeAsync();
        //     setVideoDownloadData(curVidObj.id, JSON.stringify({ finished: true, uri }))
        //     console.log('Finished downloading to ', uri);
        // } catch (e) {
        //     console.error(e);
        // }
    }
    resumeDownload = async () => {
        const { currentVideoDownloadData: downloadSnapshotJson } = this.state;
        //To resume a download across app restarts, assuming the the DownloadResumable.savable() object was stored:
        // const downloadSnapshotJson = await AsyncStorage.getItem('pausedDownload');
        const downloadSnapshot = JSON.parse(downloadSnapshotJson);
        const downloadResumable = new FileSystem.DownloadResumable(
            downloadSnapshot.url,
            downloadSnapshot.fileUri,
            downloadSnapshot.options,
            this.downloadProgressCallback,
            downloadSnapshot.resumeData
        );

        try {
            const { uri } = await downloadResumable.resumeAsync();
            console.log('Finished downloading to ', uri);

        } catch (e) {
            console.log(e)
            this.startFreshDownload()
        }
    }
    componentDidMount() {
        this.getLocalVideosList()
        this.getCurrentVideoDownloadData()
    }
    _changeCurrentVideoToIndex = async (currentVideoIndex) => {
        await this.setState({ currentVideoIndex })
        this.getCurrentVideoDownloadData()
    }
    toggleDownloadMode = () => {
        const { isDownloadModalVisible } = this.state;
        this.setState({ isDownloadModalVisible: !isDownloadModalVisible })
    }
    static navigationOptions = {
        header: null,
    }
    render() {
        console.log('this.state.currentVideoDownloadData', this.state.currentVideoDownloadData);

        const { videos, currentVideoIndex, currentVideoDownloadData } = this.state
        let curVidObj = {}
        if (videos.length)
            curVidObj = videos[currentVideoIndex]
        const { id, name, thumbnail, url, originalMovieName, performers, releaseDate } = curVidObj
        if (this.state.isLoading) {
            return (
                <ImageBackground
                    source={require('./../../../assets/images/loginScreen.jpg')}
                    style={styles.spinnerContainer}>
                    <ActivityIndicator color={ThemeColors.primaryColor} />
                </ImageBackground>
            )
        }
        if (!this.props.isFocused) {
            return null
        }
        return (
            <View style={styles.container} isLoading={this.state.isLoading}>
                <ImageBackground style={styles.flex1} source={require('./../../../assets/images/loginScreen.jpg')}>
                    <View style={styles.videoContainer}>
                        <VideoPlayer
                            videoProps={{
                                shouldPlay: false,
                                resizeMode: Video.RESIZE_MODE_STRETCH,
                                source: {
                                    // uri: 'https://video.xx.fbcdn.net/v/t42.9040-2/82831859_798834793916117_6703200891031257088_n.mp4?_nc_cat=107&_nc_sid=985c63&efg=eyJybHIiOjMwMCwicmxhIjo4NTYsInZlbmNvZGVfdGFnIjoic3ZlX3NkIn0%3D&_nc_ohc=5xza5k8qj5EAX-FC3va&rl=300&vabr=135&_nc_ht=video-iad3-1.xx&oh=dc1196a0ed98d1ca57c66e861e4f3c7a&oe=5E92BBFE',
                                    uri: url,
                                },
                            }}
                            showControlsOnLoad
                            inFullscreen={true}
                            videoBackground='transparent'
                            width={WINDOW_WIDTH}
                            height={scaleSize(200)}
                        />
                    </View>

                    {/* /////////////////////////////  Metadata CONTAINER /////////////////////////////////// */}

                    <View style={styles.meta}>
                        <View style={styles.flex1}>
                            <Text style={styles.name}>
                                {name}  {originalMovieName && '(' + originalMovieName + ')'}
                            </Text>
                            <Text style={styles.metaInfo}>
                                <Icon style={styles.inlineIcons} name='microphone' />
                                {'  '}{performers}
                            </Text>
                            <Text style={styles.metaInfo}>
                                <Icon style={styles.inlineIcons} name='calendar' />
                                {'  '}{releaseDate}
                            </Text>
                        </View>
                        <View style={styles.actionButtonContainer}>
                            <AppIcon onPress={this.handleSharing} containerStyles={styles.actionButton} name='share' />
                            <AppIcon onPress={this.toggleDownloadMode} containerStyles={styles.actionButton} name='download' />
                            {/* <AppIcon containerStyles={styles.actionButton} name='bomb' /> */}
                        </View>
                    </View>

                    {/* /////////////////////////////  VIDEO List CONTAINER /////////////////////////////////// */}

                    <View style={styles.videoListContainer}>
                        <FlatList
                            keyExtractor={(item, index) => index}
                            numColumns={3}
                            renderItem={this.renderVideoListItem}
                            data={videos}
                        />
                    </View>
                </ImageBackground>
                <Modal
                    transparent
                    animationType='slide'
                    // visible={false}
                    visible={this.state.isDownloadModalVisible}
                    onRequestClose={this.toggleDownloadMode}
                >
                    <OverLay style={styles.bothCentered}>
                        <ImageBackground
                            source={require('./../../../assets/images/loginScreen.jpg')}
                            style={styles.downloadBoxImage}
                        >
                            <AppIcon
                                onPress={this.toggleDownloadMode}
                                name={'close'} color={ThemeColors.primaryColor}
                                containerStyles={styles.closeIcon}
                            />
                            <View style={[styles.downloadBox, styles.bothCentered]}>
                                <View style={styles.downloadBoxVideoMeta}>
                                    <Image
                                        resizeMode='cover'
                                        source={{ uri: curVidObj.thumbnail }}
                                        style={styles.downloadBoxThumb}
                                    />
                                    <View style={styles.flex1}>
                                        <Text style={styles.name}>
                                            {name}  {originalMovieName && '(' + originalMovieName + ')'}
                                        </Text>
                                        <Text style={styles.metaInfo}>
                                            <Icon style={styles.inlineIcons} name='microphone' />
                                            {'  '}{performers}
                                        </Text>
                                        <Text style={styles.metaInfo}>
                                            <Icon style={styles.inlineIcons} name='calendar' />
                                            {'  '}{releaseDate}
                                        </Text>
                                    </View>
                                </View>

                                {
                                    currentVideoDownloadData?.finished ?
                                        <>
                                            <View style={styles.bothCentered}>
                                                <AppIcon color={ThemeColors.primaryColor} size={80} name={'check-circle'} />
                                                <Text style={styles.downloadedText}>
                                                    Download complete
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                onPress={this.handleSharing}
                                                style={styles.button}>
                                                <Text style={styles.buttonText}>
                                                    Share
                                                </Text>
                                            </TouchableOpacity>
                                        </>
                                        :
                                        <>
                                            <View style={styles.bothCentered}>
                                                {/* <AppIcon color={ThemeColors.primaryColor} size={80} name='download' /> */}
                                                {
                                                    this.state.downloadProgress &&
                                                    this.state.downloadProgress['a' + this.state.currentVideoIndex] &&
                                                    <View style={styles.downloadProgressContainer}>
                                                        <Text style={styles.downloadedText}>
                                                            {
                                                                (
                                                                    this.state.downloadProgress['a' + this.state.currentVideoIndex] ?
                                                                        this.state.downloadProgress['a' + this.state.currentVideoIndex] * 100
                                                                        :
                                                                        0
                                                                ).toFixed(2) + '%'}
                                                        </Text>
                                                        {/* <CustomSlider
                                                            hideThumb
                                                            disabled
                                                            style={styles.flex1}
                                                            maximumTrackTintColor={ThemeColors.primaryColorRgba + '0.3)'}
                                                            minimumTrackTintColor={ThemeColors.primaryColor}
                                                            value={this.state.downloadProgress}
                                                        /> */}
                                                    </View>}
                                            </View>
                                            <TouchableOpacity
                                                onPress={this.onStartDownload}
                                                style={styles.button}>
                                                <Text style={styles.buttonText}>
                                                    Start Download
                                                </Text>
                                            </TouchableOpacity>
                                        </>
                                }
                            </View>
                        </ImageBackground>
                    </OverLay>
                </Modal>
            </View >
        );
    }
    renderVideoListItem = ({ item, index }) => {
        const { currentVideoIndex, videos } = this.state;
        let curVidObj = {},
            isPlaying = index == currentVideoIndex;
        if (videos.length)
            curVidObj = videos[currentVideoIndex]
        const { id, name, thumbnail, url, originalMovieName, performers, releaseDate } = curVidObj
        return (
            <View style={styles.videoListItem}>
                <TouchableOpacity onPress={() => this._changeCurrentVideoToIndex(index)} >
                    <Image
                        resizeMode='cover'
                        source={{ uri: item.thumbnail }}
                        style={styles.videoListItem}
                    />
                    <View style={[styles.videoListItem, styles.itemOverlay, styles.bothCentered, isPlaying && styles.activeItem]}>
                        {
                            isPlaying &&
                            <Text style={styles.name} >Now playing...</Text>
                        }
                    </View>
                </TouchableOpacity>
            </View >
        )
    }
}
export default withNavigationFocus(VideosList)

const styles = StyleSheet.create({
    flex1: {
        flex: 1
    },
    container: {
        flex: 1,
        paddingTop: STATUSBAR_HEIGHT
    },
    spinnerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    spinner: {
        color: ThemeColors.primaryColor,
    },
    meta: {
        flexDirection: 'row',
        backgroundColor: ThemeColors.backgroundColor,
        paddingVertical: scaleSize(10),
        paddingHorizontal: scaleSize(10)
    },
    inlineIcons: {
        fontSize: appFontScale(10),
        color: ThemeColors.primaryColor
    },
    name: {
        fontSize: appFontScale(12),
        color: ThemeColors.primaryColor
    },
    metaInfo: {
        fontSize: appFontScale(10),
        color: ThemeColors.primaryColorRgba + '0.8)'
    },
    actionButtonContainer: {
        flexDirection: 'row',
    },
    actionButton: {
        marginHorizontal: scaleSize(5)
    },
    videoContainer: {
        height: scaleSize(200)
    },
    videoListContainer: {
        flex: 1,
        // backgroundColor: ThemeColors.highlightsColor
    },
    videoListItem: {
        width: (WINDOW_WIDTH / 3),
        height: (WINDOW_WIDTH / 3),
        backgroundColor: ThemeColors.backgroundColor,
        // height: 100,
        // borderColor: ThemeColors.secondaryColor,
        // borderWidth: 0.5
    },
    downloadBoxVideoMeta: {
        flexDirection: 'row',
    },
    downloadBoxThumb: {
        width: (WINDOW_WIDTH / 5),
        height: (WINDOW_WIDTH / 5),
        backgroundColor: ThemeColors.backgroundColor,
        marginRight: 10
    },
    itemOverlay: {
        backgroundColor: ThemeColors.highlightsColorRgba + '0.5)',
        // opacity: 0.5,
        position: 'absolute',
        top: 0,
        left: 0
    },
    activeItem: {
        backgroundColor: ThemeColors.highlightsColorRgba + '0.8)',
    },
    bothCentered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    downloadBoxImage: {
        width: scaleSize(300),
        height: scaleSize(300),
        borderRadius: scaleSize(10),
        overflow: 'hidden',
    },
    downloadBox: {
        width: scaleSize(300),
        height: scaleSize(300),
        padding: scaleSize(15)
    },
    textAlignCenter: {
        textAlign: 'center'
    },
    justifyEnd: {
        justifyContent: 'flex-end'
    },
    button: {
        backgroundColor: ThemeColors.primaryColor,
        paddingVertical: scaleSize(5),
        paddingHorizontal: scaleSize(15),
        borderRadius: scaleSize(5),
        width: scaleSize(280),
        alignItems: 'center',
        justifyContent: 'center'
    },
    downloadedText: {
        color: ThemeColors.primaryColor,
        textAlign: 'center',
        fontSize: appFontScale(25),
        marginVertical: scaleSize(15)
    },
    closeIcon: {
        alignSelf: 'flex-end',
        margin: scaleSize(10)
    },
    downloadProgressContainer: {
        width: scaleSize(150),
        marginVertical: scaleSize(15)
    }
});








