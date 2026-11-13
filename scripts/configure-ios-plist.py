"""Apply BloomBooth iOS native permissions after 'npx cap add ios'."""
from pathlib import Path
import plistlib
import sys
path=Path(sys.argv[1] if len(sys.argv)>1 else "ios-app/ios/App/App/Info.plist")
if not path.is_file():
    raise SystemExit(f"iOS Info.plist not found: {path}")
with path.open("rb") as f:
    data=plistlib.load(f)
data.update({
    "NSCameraUsageDescription":"BloomBooth cần camera để chụp và ghép ảnh.",
    "NSPhotoLibraryAddUsageDescription":"BloomBooth lưu bộ ảnh đã ghép trực tiếp vào ứng dụng Ảnh của bạn.",
    "NSPhotoLibraryUsageDescription":"BloomBooth chỉ dùng thư viện Ảnh để lưu bộ ảnh đã ghép.",
    "ITSAppUsesNonExemptEncryption":False,
})
with path.open("wb") as f:
    plistlib.dump(data,f,sort_keys=False)
print("Set iOS Camera and Photos usage strings:",path)
