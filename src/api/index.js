/* eslint class-methods-use-this: 0 */

import { snapshotToArray } from './../helpers';
import firebase from './../lib/firebase';
import '@firebase/firestore'
const firestoreDb = firebase.firestore()

class API {
  uid = '';
  dbRef = null;
  messagesRef = null;

  constructor() {
    this.getCurrentUser()
  }

  setDbRef() {
    this.dbRef = firebase.database().ref();
  }

  setCurrentUser() {
    this.currentUser = firebase.auth().currentUser;
  }
  getCurrentUserExtraData = () => new Promise((resolve, reject) => {
    // if (!this.dbRef) { 
    this.getCurrentUser()
      .then(fbUser => {
        console.log('firebaseUser: ' + fbUser)
        if (fbUser) {
          this.getUserById(fbUser.uid)
            .then(user => resolve(user))
            .catch(e => resolve(false))
        }
        else {
          resolve(false)
        }
      })
      .catch(e => resolve(false))
    // }
  })
  getCurrentUser = () => new Promise((resolve, reject) => {
    try {
      firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
          console.log('user.uid:', user.uid)
          this.setUid(user.uid);
          this.setDbRef();
          this.setCurrentUser();
          resolve(user);
        }
        else {
          console.log('user.uid: Not Signed in')
          resolve(false)
        }
      })
    }
    catch (e) {
      reject(e)
    }
  })


  setUid(value) {
    this.uid = value;
  }

  getUid() {
    return this.uid;
  }

  // retrieve the messages from the Backend
  loadMessages(callback) {
    this.messagesRef = firebase.database().ref('messages');
    this.messagesRef.off();
    const onReceive = (data) => {
      const message = data.val();
      callback({
        _id: data.key,
        text: message.text,
        createdAt: new Date(message.createdAt),
        user: {
          _id: message.user._id,
          name: message.user.name,
          userColor: message.user.userColor
        },
      });
    };
    this.messagesRef.limitToLast(20).on('child_added', onReceive);
  }

  // send the message to the Backend
  sendMessage(message) {
    for (let i = 0; i < message.length; i++) {
      this.messagesRef.push({
        text: message[i].text,
        user: message[i].user,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
      });
    }
  }

  // close the connection to the Backend
  closeChat() {
    if (this.messagesRef) {
      this.messagesRef.off();
    }
  }

  signOutFirebase() {
    return firebase.auth().signOut();
  }

  sendPasswordResetEmail(email) {
    return firebase
      .auth()
      .sendPasswordResetEmail(email);
  }

  /**
   * Get detailed information about all rooms for a specified user
   * @param  {String}  userId
   * @return {Promise} An array of objects with detailed information about each room
   */
  getRoomsByUserId = async (userId) => {
    // Get the room ids for the user
    const roomIds = await this.getUserRoomIds(userId);

    // Get detailed information about each room by its id
    return this.getRoomsByIds(roomIds);
  }

  /**
   * Get detailed information about each room id in a list
   * @param  {Array}  roomIds
   * @return {Promise} An array of objects with detailed information about each room
   */
  getRoomsByIds = async roomIds => Promise.all(roomIds.map(async (roomId) => {
    // Get the user ids of all the users in the current room in the loop
    const roomUserIds = await this.getRoomUserIds(roomId);

    // Get detailed information about each user by their id
    const users = await this.getUsersByIds(roomUserIds);

    return {
      id: roomId,
      users,
    };
  }));

  /**
   * Get the user ids for the users in a specified room
   * @param  {String}  roomId
   * @return {Promise} An array of all the users ids of the users in the room
   */
  getRoomUserIds = async (roomId) => {
    const roomUserIdsSnap = await this.dbRef.child(`roomUsers/${roomId}`).once('value');
    return snapshotToArray(roomUserIdsSnap);
  }

  /**
   * Get the rooms for a specified user
   * @param  {String}  userId
   * @return {Promise}  An array of all the room ids that a user is in
   */
  getUserRoomIds = async (userId) => {
    const userRoomsRef = this.dbRef.child(`userRooms/${userId}`);
    const userRoomsSnap = await userRoomsRef.once('value');
    return snapshotToArray(userRoomsSnap);
  }

  /**
   * Get detailed information about each user id in a list
   * @param  {Array]  userIds
   * @return {Promise}  An array of objects with detailed information about each user
   */

  getUsersByIds = async userIds => Promise.all(userIds.map(async (userId) => {
    // Get the user's name that matches the id for the user
    const userSnap = await this.dbRef.child(`users/${userId}`).once('value');
    const user = userSnap.val();
    return {
      name: user.name,
      email: user.email,
      photoURL: user.photoURL,
      uid: userId,
      userColor: user.userColor
    };
  }));

  getUserById = (userId) => new Promise(async (resolve, reject) => {
    this.dbRef.child(`users/${userId}`).once('value')
      .then(userSnap => {
        const user = userSnap.val();
        user.uid = userId;
        resolve(user)
      })
      .catch((err) => reject(err))
  });

  /**
   * Create room name by the following priority
   * 1. An assigned room name
   * 2. A comma separated list of all the user's names in the room
   * @param  {Object} room  Detailed information about a room
   * @param  {Array}  [userIds=[]] An array of user ids with which to filter out users
   * @return {String} Assigned room name or Comma separated list of all users
   */
  getRoomName = (room, userIdsToFilterOut = []) => room.name || room.users
    .filter(({ uid }) => !userIdsToFilterOut.includes(uid))
    .map(({ name }) => name)
    .join(', ')


  setOrIncrementUnreadMessageCount = ({ roomId, userIds, isCountBeingReset }) => {
    userIds.forEach((userId) => {
      const userUnreadMessagesRef = this.dbRef.child(`unreadMessagesCount/${roomId}/${userId}`);
      userUnreadMessagesRef.transaction(currentCount => (isCountBeingReset ? 0 : (currentCount || 0) + 1));
    });
  }

  /**
   * Save this chat room to the userRooms collection for all specified user ids
   */
  setUsersRoom = (chatRoomId, userIds) => {
    const userRoomsRef = this.dbRef.child('userRooms');

    const userData = userIds.reduce((usersRoom, userId) => ({
      ...usersRoom,
      [userId]: {
        [userRoomsRef.push().key]: chatRoomId,
      },
    }), {});

    // Example structure being created
    // userRoomsRef.update({
    //   [api.currentUser.uid]: {
    //     [userRoomsRef.push().key]: chatRoomId,
    //   },
    //   [this.selectedUser.uid]: {
    //     [userRoomsRef.push().key]: chatRoomId,
    //   },
    // });

    userRoomsRef.update(userData);
  }

  /**
   * Save the users for this chat room to the roomUsers collection
   */
  setRoomUsers = (chatRoomId, userIds) => {
    const roomUsersRef = this.dbRef.child(`roomUsers/${chatRoomId}`);

    const roomData = userIds.reduce((roomUsers, userId) => ({
      ...roomUsers,
      [roomUsersRef.push().key]: userId,
    }), {});

    roomUsersRef.update(roomData);

    // Example structure being created
    // roomUsersRef.update({
    //   [roomUsersRef.push().key]: api.currentUser.uid,
    //   [roomUsersRef.push().key]: this.selectedUser.uid,
    // });
  }

  getVideos = async () => {
    // Get the user's name that matches the id for the user
    // const videosSnap = await this.dbRef.child(`videos/`).once('value');
    // return snapshotToArray(videosSnap);
    let snapshot = await firestoreDb.collection('videos').get()
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
  }

  getVideoLikes = async (videoId) => {
    // const currentLikeVlaue = await this.dbRef.child('/videoLikes/' + videoId).once('value')
    // return snapshotToArray(currentLikeVlaue)
    let snapshot = await firestoreDb.collection('videoLikes').doc(videoId).get()
    return snapshot.docs?.map(doc => doc.data())
  }
  updateVideoLikesCounter = async (videoId, userId, action) => {
    try {
      if (action == 'removeLike') {
        firestoreDb.collection('videoLikes').doc(videoId + '/' + userId).delete();
      }
      else {
        firestoreDb.collection('videoLikes').doc(videoId).update({ userId })
      }
      // if (action == 'removeLike') {
      //   console.log('Removing like')
      //   let likeRef = this.dbRef.child('videoLikes/' + videoId + '/' + userId);
      //   likeRef.remove()
      //   return true
      // } else {
      //   var updates = {};
      //   updates['/videoLikes/' + videoId + '/' + userId] = userId;
      //   return this.dbRef.update(updates);
      // }
    }
    catch (error) {
      console.log('Removing like Catch Error:', error)
    }

  }


}



export default new API();
