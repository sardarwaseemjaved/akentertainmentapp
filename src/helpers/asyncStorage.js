import { AsyncStorage } from 'react-native';

export const VIDEOS_KEY = 'videos';
export const MESSAGES_KEY = 'localMessages';


export const setVideos = (videos) => AsyncStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));

export const getVideos = () => new Promise((resolve, reject) => {
    AsyncStorage.getItem(VIDEOS_KEY)
        .then((res) => {
            if (res !== null) {
                try {
                    resolve(JSON.parse(res));
                }
                catch (e) {
                    resolve([])
                }
            } else {
                resolve([]);
            }
        })
        .catch(err => resolve([]));
});


export const setMessages = (messages) => AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));

export const getMessages = () => new Promise((resolve, reject) => {
    AsyncStorage.getItem(MESSAGES_KEY)
        .then((res) => {
            if (res !== null) {
                try {
                    resolve(JSON.parse(res));
                }
                catch (e) {
                    resolve([])
                }
            } else {
                resolve([]);
            }
        })
        .catch(err => resolve([]));
});