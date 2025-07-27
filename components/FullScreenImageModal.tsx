import React from 'react';
import { Modal, View, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { X } from 'lucide-react-native';
import { DanceMove, getGifUrl } from '@/data/danceMoves';

interface FullScreenImageModalProps {
  visible: boolean;
  move: DanceMove | null;
  isPlaying: boolean;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FullScreenImageModal: React.FC<FullScreenImageModalProps> = ({
  visible,
  move,
  isPlaying,
  onClose
}) => {
  if (!move) return null;

  const getImageSource = () => {
    if (isPlaying && move.hasGif) {
      return { uri: getGifUrl(move) };
    }
    return require('@/assets/images/logoRock4you.png');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <X size={30} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.imageContainer}>
          <Image
            source={getImageSource()}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
        
        <TouchableOpacity
          style={styles.backgroundTouchable}
          onPress={onClose}
          activeOpacity={1}
        />
      </View>
    </Modal>
  );
};

export default FullScreenImageModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
  },
  imageContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: screenWidth - 40,
    height: screenHeight - 100,
    maxWidth: screenWidth - 40,
    maxHeight: screenHeight - 100,
  },
  backgroundTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
});