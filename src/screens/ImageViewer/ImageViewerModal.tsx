import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Text,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import type { RootStackParamList, NoteImage } from '../../types';

type Route = RouteProp<RootStackParamList, 'ImageViewer'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ImageViewerModal() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { theme } = useTheme();
  const { colors } = theme;

  const { images, initialIndex } = route.params;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  const handleClose = () => {
    navigation.goBack();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const renderImage = ({ item }: { item: NoteImage }) => (
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: item.uri }}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Close button */}
      <TouchableOpacity
        onPress={handleClose}
        style={[styles.closeButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Image counter */}
      {images.length > 1 && (
        <View style={[styles.counter, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {images.length}
          </Text>
        </View>
      )}

      {/* Image gallery */}
      <FlatList
        ref={flatListRef}
        data={images}
        keyExtractor={(item) => item.id}
        renderItem={renderImage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counter: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 55 : 35,
    left: 16,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
});
