# Android / Google Play

App Android là bản đóng gói của web app bằng Capacitor (`dist/` được nhúng vào WebView).
Không có code native tự viết; tương tác native nằm trong `src/native.ts` (nút Back), `src/feedback.ts` (rung qua `@capacitor/haptics`) và `src/share.ts` (chia sẻ qua `@capacitor/share`). Thêm plugin Capacitor mới thì phải chạy `npx cap sync android` để nó vào `capacitor.settings.gradle`.

- `applicationId`: `com.thanhlvt.sudoku` (`capacitor.config.ts` + `android/app/build.gradle`).
  **Không đổi được sau khi đã publish lên Play.**
- `versionCode` / `versionName`: sửa trong `android/app/build.gradle`. Mỗi lần upload bản mới
  `versionCode` phải tăng.
- `AndroidManifest.xml`: `allowBackup="false"` (tiến độ nằm trong `localStorage` của WebView; backup tự động có thể khôi phục lại dữ liệu hỏng
  sau khi cài lại) và **không tự khai báo quyền nào** — puzzle và âm thanh nằm sẵn trong APK, app không dùng mạng. Duy nhất `VIBRATE` được gộp vào từ plugin `@capacitor/haptics` (quyền thường, không hỏi người dùng; cần cho tính năng rung). Nếu sau này thêm tính năng gọi ra
  mạng thì phải thêm lại `INTERNET`. *Chưa thử trên thiết bị thật sau khi bỏ quyền này; kiểm tra bản debug trước khi phát hành.*
- Chia sẻ kết quả / sao lưu dùng `@capacitor/share` (bảng chia sẻ của Android; không cần quyền). Link tới màn chơi chỉ được gắn khi build với `VITE_PUBLIC_URL=https://…/` (địa chỉ bản web); không đặt thì chỉ chia sẻ văn bản.
- Bản Android **không** đăng ký service worker và `dist/sw.js` bị xoá khỏi bản build `--mode capacitor` (APK đã chứa mọi file). `public/manifest.webmanifest` và `icons/` vẫn đi theo nhưng vô hại.
- *Chưa thử trên thiết bị thật*: bảng chia sẻ, rung, và chọn file khi "Khôi phục" (WebView). Build debug đã chạy được.
- `android:sync` build web bằng `vite build --mode capacitor`, tức là **không** chèn Content-Security-Policy (bản web thì có, xem `vite.config.ts`).
  Lý do: Capacitor có thể chèn script bridge vào trang, và `script-src 'self'` sẽ chặn nó.

## Lệnh

```bash
npm run android:sync      # build web + copy vào project Android
npm run android:debug     # sync + build APK debug -> android/app/build/outputs/apk/debug/app-debug.apk
npm run android:open      # mở Android Studio
npm run android:bundle    # sync + build AAB release -> android/app/build/outputs/bundle/release/app-release.aab
npm run assets            # vẽ lại icon/splash từ scripts/make-icons.mjs rồi sinh vào android/res
```

Yêu cầu: JDK 17+ và Android SDK (`ANDROID_HOME`).

## Ký bản release (làm một lần)

1. Tạo upload keystore, **cất kỹ và sao lưu** (ngoài repo):

   ```bash
   keytool -genkeypair -v -keystore sudoku-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Tạo `android/keystore.properties` (đã nằm trong `.gitignore`):

   ```properties
   storeFile=../sudoku-upload.jks
   storePassword=...
   keyAlias=upload
   keyPassword=...
   ```

   `storeFile` tính tương đối từ thư mục `android/`.

3. `npm run android:bundle` → file `.aab` đã ký sẵn để upload.

Khi tạo app trên Play Console, giữ **Play App Signing** bật (mặc định): keystore trên chỉ là
upload key, nếu mất có thể xin Google reset.

## Checklist Play Console

- Tài khoản developer (phí một lần 25 USD). Tài khoản cá nhân tạo sau 2023 phải chạy
  **closed test với ≥12 tester trong 14 ngày liên tục** trước khi xin production.
- Store listing: tên, mô tả ngắn/dài, icon 512×512, feature graphic 1024×500, ≥2 screenshot điện thoại.
- Content rating (questionnaire), Target audience, **Data safety** (app không thu thập dữ liệu:
  khai báo "không thu thập/chia sẻ"), khai báo không có quảng cáo.
- Privacy policy URL: nên có một trang tĩnh (ví dụ GitHub Pages) nêu rõ app không thu thập dữ liệu
  và chỉ lưu tiến độ trên thiết bị.
- Upload `.aab` vào Internal testing trước để thử, rồi Closed → Production.
