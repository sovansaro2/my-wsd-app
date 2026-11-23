# មគ្គុទ្ទេសក៍បង្កើតកម្មវិធី iOS ក្នុង Xcode (ពីដើមដល់ចប់)

គម្រោង **វត្តស្នាយដួច** ត្រូវបានរៀបចំរួចរាល់ស្ទើរតែទាំងអស់នៅក្នុង Folder `ios/` រួចជាស្រេច៖
- **Safe Area & Native iOS UI**៖ រៀបចំរួចរាល់សម្រាប់ Dynamic Island, Notch និង Home Indicator។
- **Status Bar ពណ៌ស**៖ កំណត់រួចរាល់ក្នុង `ios/App/App/Info.plist` (`UIStatusBarStyleLightContent`)។
- **App Icon (1024×1024 គ្មានផ្ទៃថ្លា)**៖ ដាក់រួចរាល់ក្នុង `ios/App/App/Assets.xcassets/AppIcon.appiconset/`។
- **Splash Screen (`#028090` + ឡូហ្គោវត្ត)**៖ ដាក់រួចរាល់ក្នុង `ios/App/App/Assets.xcassets/Splash.imageset/`។
- **API ភ្ជាប់ស្វ័យប្រវត្តិ**៖ ភ្ជាប់ទៅ `https://www.watsnaydouch.site` ដោយស្វ័យប្រវត្តិពេលដំណើរការជា iOS App។

---

## ជំហានទី ១៖ ឧបករណ៍ដែលត្រូវការលើ Mac
1. **macOS** ជាមួយ **Xcode** (ទាញយកពី Mac App Store)
2. **Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```
3. **Node.js 20+** (ពិនិត្យដោយ `node -v`)
4. **CocoaPods** (បើ Xcode ទាមទារ):
   ```bash
   sudo gem install cocoapods
   ```

---

## ជំហានទី ២៖ Sync កូដ និងបើកក្នុង Xcode
ចូលទៅកាន់ Folder គម្រោងក្នុង Terminal លើ Mac ហើយដំណើរការ៖

```bash
# ១. ដំឡើង Dependencies
npm install

# ២. Build និង Sync កូដចូលទៅ Folder ios/
npm run build:ios

# ៣. បើកគម្រោងក្នុង Xcode
npm run cap:open:ios
```

---

## ជំហានទី ៣៖ កំណត់ Apple ID / Team ក្នុង Xcode (អ្វីដែលអ្នកត្រូវធ្វើលើ Mac)
1. ចុចលើ Project **App** (ខាងឆ្វេង) → Target **App** → ផ្ទាំង **Signing & Capabilities**
2. ធីក **Automatically manage signing**
3. ជ្រើសរើស **Team** (គណនី Apple ID ឬ Apple Developer របស់អ្នក)
4. ពិនិត្យ **Bundle Identifier**៖ `com.watsnaydouch.app` (ឬប្តូរតាមឈ្មោះដែលអ្នកចង់បាន បើ Apple បញ្ជាក់ថាឈ្មោះជាន់គ្នា)

---

## ជំហានទី ៤៖ សាកល្បងលើ Simulator ឬ iPhone ផ្ទាល់
1. **លើ Simulator**៖ ជ្រើសរើស **iPhone 16 Pro** នៅរបារខាងលើ Xcode → ចុច **Run (`⌘ + R`)**។
2. **លើ iPhone ផ្ទាល់**៖
   - ភ្ជាប់ iPhone តាមខ្សែ USB → បើក **Developer Mode** ក្នុង `Settings → Privacy & Security → Developer Mode`
   - ជ្រើសរើសឈ្មោះ iPhone របស់អ្នកក្នុង Xcode → ចុច **Run (`⌘ + R`)**
   - លើកដំបូង បើ iPhone សួរសិទ្ធិ សូមចូល `Settings → General → VPN & Device Management` → ចុច **Trust**។

---

## ជំហានទី ៥៖ ដាក់ឡើង TestFlight / App Store
1. ជ្រើសរើស Device ជា **Any iOS Device (arm64)**
2. ចូល Menu **Product → Archive**
3. ពេល Archive ចប់ ចុច **Distribute App → App Store Connect → Upload**
4. ចូលទៅកាន់ [App Store Connect](https://appstoreconnect.apple.com) ដើម្បីចែកចាយតាម **TestFlight** ឬដាក់ស្នើឡើង **App Store**។
