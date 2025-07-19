import { Image as RNImage } from 'react-native';
import defaultAvatar from '../../assets/default-avatar.png'; // adjust path as needed

export const DEFAULT_AVATAR_URI = RNImage.resolveAssetSource(defaultAvatar).uri;
