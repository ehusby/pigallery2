# Benchmark history


## PiGallery2 v1.8.7, 12.05.2021
**Versions**: v1.8.7, build time: 2021-05-11T22:16:06.455Z, git commit: 872e63703dded0331590c865b3746182f1b48b10

**System**: Raspberry Pi 4 4G Model B, SandisK Mobile Ultra 32Gb CLass10, UHS-I, HDD: Western Digital Elements 1TB (WDBUZG0010BBK)

**Gallery**: directories: 31, photos: 2036, videos: 35, diskUsage : 22.08GB, persons : 1241, unique persons (faces): 14

| Action | Sub action | Average Duration | Result  |
|:------:|:----------:|:----------------:|:-------:|
| **Scanning directory** | | **10797.2 ms** | **media: 698, directories: 0** |
| **Saving directory to DB** | | **3799.6 ms** | **-** |
| **List directory** | | **325.8 ms** | **media: 698, directories: 0** |
| | Authenticate | 0.1 ms | - |
| | Normalize path param | 0.0 ms | - |
| | Authorise path | 0.0 ms | - |
| | Inject gallery version | 5.4 ms | - |
| | List directory | 245.9 ms | media: 698, directories: 0 |
| | Add thumbnail information | 57.1 ms | media: 698, directories: 0 |
| | Clean up gallery results | 17.0 ms | media: 698, directories: 0 |
| | Render result | 0.0 ms | media: 698, directories: 0 |
| **Listing Faces** | | **16.3 ms** | **items: 14** |
| | Authenticate | 0.1 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 3.4 ms | - |
| | List persons | 10.5 ms | items: 14 |
| | Add thumbnail info for persons | 1.0 ms | items: 14 |
| | Clean up person results | 1.1 ms | items: 14 |
| | Render result | 0.0 ms | items: 14 |
| **Searching for `a`** | | **782.1 ms** | **media: 2001, directories: 0** |
| | Authenticate | 0.1 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 575.5 ms | media: 2001, directories: 0 |
| | Add thumbnail information | 157.6 ms | media: 2001, directories: 0 |
| | Clean up gallery results | 48.5 ms | media: 2001, directories: 0 |
| | Render result | 0.0 ms | media: 2001, directories: 0 |
| **Searching for `caption:a`** | | **6.4 ms** | **media: 0, directories: 0** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.1 ms | - |
| | Search | 6.0 ms | media: 0, directories: 0 |
| | Add thumbnail information | 0.1 ms | media: 0, directories: 0 |
| | Clean up gallery results | 0.0 ms | media: 0, directories: 0 |
| | Render result | 0.0 ms | media: 0, directories: 0 |
| **Searching for `directory:a`** | | **669.8 ms** | **media: 1705, directories: 0** |
| | Authenticate | 0.1 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 494.6 ms | media: 1705, directories: 0 |
| | Add thumbnail information | 134.2 ms | media: 1705, directories: 0 |
| | Clean up gallery results | 40.4 ms | media: 1705, directories: 0 |
| | Render result | 0.0 ms | media: 1705, directories: 0 |
| **Searching for `file-name:a`** | | **38.1 ms** | **media: 79, directories: 0** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 29.1 ms | media: 79, directories: 0 |
| | Add thumbnail information | 6.7 ms | media: 79, directories: 0 |
| | Clean up gallery results | 1.9 ms | media: 79, directories: 0 |
| | Render result | 0.0 ms | media: 79, directories: 0 |
| **Searching for `keyword:a`** | | **603.8 ms** | **media: 1534, directories: 0** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 447.3 ms | media: 1534, directories: 0 |
| | Add thumbnail information | 121.0 ms | media: 1534, directories: 0 |
| | Clean up gallery results | 35.0 ms | media: 1534, directories: 0 |
| | Render result | 0.0 ms | media: 1534, directories: 0 |
| **Searching for `person:a`** | | **321.7 ms** | **media: 768, directories: 0** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 240.3 ms | media: 768, directories: 0 |
| | Add thumbnail information | 61.4 ms | media: 768, directories: 0 |
| | Clean up gallery results | 19.6 ms | media: 768, directories: 0 |
| | Render result | 0.0 ms | media: 768, directories: 0 |
| **Searching for `position:a`** | | **461.9 ms** | **media: 1133, directories: 0** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 346.9 ms | media: 1133, directories: 0 |
| | Add thumbnail information | 89.0 ms | media: 1133, directories: 0 |
| | Clean up gallery results | 25.5 ms | media: 1133, directories: 0 |
| | Render result | 0.0 ms | media: 1133, directories: 0 |
| **Searching for `.`** | | **792.5 ms** | **media: 2001, directories: 0** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 589.4 ms | media: 2001, directories: 0 |
| | Add thumbnail information | 156.1 ms | media: 2001, directories: 0 |
| | Clean up gallery results | 46.6 ms | media: 2001, directories: 0 |
| | Render result | 0.0 ms | media: 2001, directories: 0 |
| **Searching for `<Most common name>`** | | **109.9 ms** | **media: 238, directories: 0** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 83.5 ms | media: 238, directories: 0 |
| | Add thumbnail information | 20.1 ms | media: 238, directories: 0 |
| | Clean up gallery results | 5.9 ms | media: 238, directories: 0 |
| | Render result | 0.0 ms | media: 238, directories: 0 |
| **Searching for `<Most AND second common names>`** | | **20.0 ms** | **media: 20, directories: 0** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.1 ms | - |
| | Search | 17.3 ms | media: 20, directories: 0 |
| | Add thumbnail information | 1.7 ms | media: 20, directories: 0 |
| | Clean up gallery results | 0.6 ms | media: 20, directories: 0 |
| | Render result | 0.0 ms | media: 20, directories: 0 |
| **Searching for `<Most OR second common names>`** | | **185.1 ms** | **media: 423, directories: 0** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 138.3 ms | media: 423, directories: 0 |
| | Add thumbnail information | 35.7 ms | media: 423, directories: 0 |
| | Clean up gallery results | 10.6 ms | media: 423, directories: 0 |
| | Render result | 0.0 ms | media: 423, directories: 0 |
| **Searching for `<Contain at least 2 out of all names>`** | | **4443.9 ms** | **media: 288, directories: 0** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 4412.9 ms | media: 288, directories: 0 |
| | Add thumbnail information | 22.8 ms | media: 288, directories: 0 |
| | Clean up gallery results | 7.8 ms | media: 288, directories: 0 |
| | Render result | 0.0 ms | media: 288, directories: 0 |
| **Auto complete for `a`** | | **19.5 ms** | **items: 30** |
| | Authenticate | 0.1 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.1 ms | - |
| | Autocomplete | 19.2 ms | items: 30 |
| | Render result | 0.0 ms | items: 30 |
*Measurements run 50 times and an average was calculated.


## PiGallery2 v1.8.6, 10.05.2021
**Versions**: v1.8.6, build time: 2021-05-10T11:13:55.634Z, git commit: a75a28f5c45e38b9053400c3fecd0fbcdff35fbb
**System**: Raspberry Pi 4 4G Model B, SandisK Mobile Ultra 32Gb CLass10, UHS-I, HDD: Western Digital Elements 1TB (WDBUZG0010BBK)

**Gallery**: directories: 31, photos: 2036, videos: 35, diskUsage : 22.08GB, persons : 1241, unique persons (faces): 14

| Action | Sub action | Average Duration | Result  |
|:------:|:----------:|:----------------:|:-------:|
| **Scanning directory** | | **9877.1 ms** | **media: 698, directories: 0** |
| **Saving directory to DB** | | **3734.9 ms** | **-** |
| **List directory** | | **350.5 ms** | **media: 698, directories: 0** |
| | Authenticate | 0.1 ms | - |
| | Normalize path param | 0.0 ms | - |
| | Authorise path | 0.0 ms | - |
| | Inject gallery version | 5.1 ms | - |
| | List directory | 267.3 ms | media: 698, directories: 0 |
| | Add thumbnail information | 60.2 ms | media: 698, directories: 0 |
| | Clean up gallery results | 17.5 ms | media: 698, directories: 0 |
| | Render result | 0.0 ms | media: 698, directories: 0 |
| **Listing Faces** | | **15.8 ms** | **items: 14** |
| | Authenticate | 0.1 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 3.2 ms | - |
| | List persons | 10.2 ms | items: 14 |
| | Add thumbnail info for persons | 1.0 ms | items: 14 |
| | Clean up person results | 1.0 ms | items: 14 |
| | Render result | 0.0 ms | items: 14 |
| **Searching for `a`** | | **1025.4 ms** | **media: 2001, directories: 0** |
| | Authenticate | 0.1 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 811.6 ms | media: 2001, directories: 0 |
| | Add thumbnail information | 163.2 ms | media: 2001, directories: 0 |
| | Clean up gallery results | 50.2 ms | media: 2001, directories: 0 |
| | Render result | 0.0 ms | media: 2001, directories: 0 |
| **Searching for `caption:a`** | | **8.6 ms** | **media: 0, directories: 0** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.1 ms | - |
| | Search | 8.2 ms | media: 0, directories: 0 |
| | Add thumbnail information | 0.1 ms | media: 0, directories: 0 |
| | Clean up gallery results | 0.0 ms | media: 0, directories: 0 |
| | Render result | 0.0 ms | media: 0, directories: 0 |
| **Searching for `directory:a`** | | **858.3 ms** | **media: 1705, directories: 0** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 678.5 ms | media: 1705, directories: 0 |
| | Add thumbnail information | 139.8 ms | media: 1705, directories: 0 |
| | Clean up gallery results | 39.5 ms | media: 1705, directories: 0 |
| | Render result | 0.0 ms | media: 1705, directories: 0 |
| **Searching for `file-name:a`** | | **45.5 ms** | **media: 79, directories: 0** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 36.7 ms | media: 79, directories: 0 |
| | Add thumbnail information | 6.5 ms | media: 79, directories: 0 |
| | Clean up gallery results | 1.9 ms | media: 79, directories: 0 |
| | Render result | 0.0 ms | media: 79, directories: 0 |
| **Searching for `keyword:a`** | | **765.2 ms** | **media: 1534, directories: 0** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.3 ms | - |
| | Search | 601.4 ms | media: 1534, directories: 0 |
| | Add thumbnail information | 126.1 ms | media: 1534, directories: 0 |
| | Clean up gallery results | 37.1 ms | media: 1534, directories: 0 |
| | Render result | 0.0 ms | media: 1534, directories: 0 |
| **Searching for `person:a`** | | **483.6 ms** | **media: 768, directories: 0** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 399.7 ms | media: 768, directories: 0 |
| | Add thumbnail information | 63.1 ms | media: 768, directories: 0 |
| | Clean up gallery results | 20.2 ms | media: 768, directories: 0 |
| | Render result | 0.0 ms | media: 768, directories: 0 |
| **Searching for `position:a`** | | **634.2 ms** | **media: 1133, directories: 0** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 514.6 ms | media: 1133, directories: 0 |
| | Add thumbnail information | 92.9 ms | media: 1133, directories: 0 |
| | Clean up gallery results | 26.4 ms | media: 1133, directories: 0 |
| | Render result | 0.0 ms | media: 1133, directories: 0 |
| **Searching for `.`** | | **1072.0 ms** | **media: 2001, directories: 0** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 860.1 ms | media: 2001, directories: 0 |
| | Add thumbnail information | 164.0 ms | media: 2001, directories: 0 |
| | Clean up gallery results | 47.5 ms | media: 2001, directories: 0 |
| | Render result | 0.0 ms | media: 2001, directories: 0 |
| **Searching for `<Most common name>`** | | **145.9 ms** | **media: 238, directories: 0** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 118.7 ms | media: 238, directories: 0 |
| | Add thumbnail information | 20.3 ms | media: 238, directories: 0 |
| | Clean up gallery results | 6.5 ms | media: 238, directories: 0 |
| | Render result | 0.0 ms | media: 238, directories: 0 |
| **Searching for `<Most AND second common names>`** | | **31.3 ms** | **media: 20, directories: 0** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.1 ms | - |
| | Search | 28.5 ms | media: 20, directories: 0 |
| | Add thumbnail information | 1.8 ms | media: 20, directories: 0 |
| | Clean up gallery results | 0.6 ms | media: 20, directories: 0 |
| | Render result | 0.0 ms | media: 20, directories: 0 |
| **Searching for `<Most OR second common names>`** | | **281.7 ms** | **media: 423, directories: 0** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 234.3 ms | media: 423, directories: 0 |
| | Add thumbnail information | 36.2 ms | media: 423, directories: 0 |
| | Clean up gallery results | 10.8 ms | media: 423, directories: 0 |
| | Render result | 0.0 ms | media: 423, directories: 0 |
| **Searching for `<Contain at least 2 out of all names>`** | | **4596.3 ms** | **media: 288, directories: 0** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 4558.1 ms | media: 288, directories: 0 |
| | Add thumbnail information | 26.7 ms | media: 288, directories: 0 |
| | Clean up gallery results | 11.0 ms | media: 288, directories: 0 |
| | Render result | 0.0 ms | media: 288, directories: 0 |
| **Auto complete for `a`** | | **20.7 ms** | **items: 30** |
| | Authenticate | 0.1 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Autocomplete | 20.4 ms | items: 30 |
| | Render result | 0.0 ms | items: 30 |

run for : 1586292.0ms
*Measurements run 50 times and an average was calculated.




## PiGallery2 v1.8.2, 31.12.2020
**System**: Raspberry Pi 4 4G Model B, SandisK Mobile Ultra 32Gb CLass10, UHS-I, HDD: Western Digital Elements 1TB (WDBUZG0010BBK)

**OS**: Raspbian GNU/Linux 10 (buster)

**Gallery**: directories: 31, photos: 2036, videos: 35, diskUsage : 22.08GB, persons : 1241, unique persons (faces): 14

| Action | Sub action | Average Duration | Result  |
|:------:|:----------:|:----------------:|:-------:|
| **Scanning directory** | | **10231.7 ms** | **media: 698, directories:0** |
| **Saving directory to DB** | | **3070.8 ms** | **-** |
| **List directory** | | **332.2 ms** | **media: 698, directories:0** |
| | Authenticate | 0.1 ms | - |
| | Normalize path param | 0.0 ms | - |
| | Authorise path | 0.0 ms | - |
| | Inject gallery version | 11.5 ms | - |
| | List directory | 243.7 ms | media: 698, directories:0 |
| | Add thumbnail information | 60.5 ms | media: 698, directories:0 |
| | Clean up gallery results | 16.1 ms | media: 698, directories:0 |
| | Render result | 0.0 ms | media: 698, directories:0 |
| **Listing Faces** | | **335.6 ms** | **items: 14** |
| | Authenticate | 0.1 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 6.1 ms | - |
| | List persons | 1.6 ms | items: 14 |
| | Add sample photo for all | 326.4 ms | items: 14 |
| | Add thumbnail info for persons | 1.0 ms | items: 14 |
| | Remove sample photo for all | 0.1 ms | items: 14 |
| | Render result | 0.0 ms | items: 14 |
| **Searching for `a` as `directory`** | | **858.0 ms** | **media: 1679, directories:21** |
| | Authenticate | 0.1 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 668.4 ms | media: 1679, directories:21 |
| | Add thumbnail information | 150.5 ms | media: 1679, directories:21 |
| | Clean up gallery results | 38.6 ms | media: 1679, directories:21 |
| | Render result | 0.0 ms | media: 1679, directories:21 |
| **Searching for `a` as `person`** | | **475.8 ms** | **media: 768, directories:21** |
| | Authenticate | 0.1 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 386.5 ms | media: 768, directories:21 |
| | Add thumbnail information | 68.6 ms | media: 768, directories:21 |
| | Clean up gallery results | 20.2 ms | media: 768, directories:21 |
| | Render result | 0.0 ms | media: 768, directories:21 |
| **Searching for `a` as `keyword`** | | **760.8 ms** | **media: 1534, directories:21** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 589.3 ms | media: 1534, directories:21 |
| | Add thumbnail information | 136.9 ms | media: 1534, directories:21 |
| | Clean up gallery results | 33.9 ms | media: 1534, directories:21 |
| | Render result | 0.0 ms | media: 1534, directories:21 |
| **Searching for `a` as `position`** | | **625.5 ms** | **media: 1133, directories:21** |
| | Authenticate | 0.1 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 499.7 ms | media: 1133, directories:21 |
| | Add thumbnail information | 102.4 ms | media: 1133, directories:21 |
| | Clean up gallery results | 22.6 ms | media: 1133, directories:21 |
| | Render result | 0.0 ms | media: 1133, directories:21 |
| **Searching for `a` as `photo`** | | **46.2 ms** | **media: 65, directories:21** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 38.2 ms | media: 65, directories:21 |
| | Add thumbnail information | 5.9 ms | media: 65, directories:21 |
| | Clean up gallery results | 1.7 ms | media: 65, directories:21 |
| | Render result | 0.0 ms | media: 65, directories:21 |
| **Searching for `a` as `video`** | | **19.9 ms** | **media: 14, directories:21** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.1 ms | - |
| | Search | 18.0 ms | media: 14, directories:21 |
| | Add thumbnail information | 1.3 ms | media: 14, directories:21 |
| | Clean up gallery results | 0.2 ms | media: 14, directories:21 |
| | Render result | 0.0 ms | media: 14, directories:21 |
| **Searching for `a` as `any`** | | **1038.2 ms** | **media: 2001, directories:21** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.2 ms | - |
| | Search | 814.9 ms | media: 2001, directories:21 |
| | Add thumbnail information | 180.0 ms | media: 2001, directories:21 |
| | Clean up gallery results | 42.8 ms | media: 2001, directories:21 |
| | Render result | 0.0 ms | media: 2001, directories:21 |
| **Instant search for `a`** | | **25.1 ms** | **media: 10, directories:10** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.1 ms | - |
| | Instant search | 23.5 ms | media: 10, directories:10 |
| | Add thumbnail information | 0.9 ms | media: 10, directories:10 |
| | Clean up gallery results | 0.3 ms | media: 10, directories:10 |
| | Render result | 0.0 ms | media: 10, directories:10 |
| **Auto complete for `a`** | | **21.8 ms** | **items: 35** |
| | Authenticate | 0.1 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.1 ms | - |
| | Autocomplete | 21.4 ms | items: 35 |
| | Render result | 0.0 ms | items: 35 |
*Measurements run 50 times, and an average was calculated.


## PiGallery2 v1.8.2, 31.12.2020
**System**: Intel(R) Core(TM) i7-6700HQ CPU @ 2.60GHz, 16GB Ram, SHDD: 1TB, 5400 rpm

**OS**: Windows 10, build: 19041.685

**Gallery**: directories: 31, photos: 2036, videos: 35, diskUsage : 22.08GB, persons : 1241, unique persons (faces): 14

| Action | Sub action | Average Duration | Result  |
|:------:|:----------:|:----------------:|:-------:|
| **Scanning directory** | | **2357.2 ms** | **media: 698, directories:0** |
| **Saving directory to DB** | | **1033.1 ms** | **-** |
| **List directory** | | **115.3 ms** | **media: 698, directories:0** |
| | Authenticate | 0.0 ms | - |
| | Normalize path param | 0.0 ms | - |
| | Authorise path | 0.0 ms | - |
| | Inject gallery version | 2.0 ms | - |
| | List directory | 58.8 ms | media: 698, directories:0 |
| | Add thumbnail information | 50.5 ms | media: 698, directories:0 |
| | Clean up gallery results | 4.0 ms | media: 698, directories:0 |
| | Render result | 0.0 ms | media: 698, directories:0 |
| **Listing Faces** | | **79.1 ms** | **items: 14** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 1.8 ms | - |
| | List persons | 0.6 ms | items: 14 |
| | Add sample photo for all | 76.0 ms | items: 14 |
| | Add thumbnail info for persons | 0.5 ms | items: 14 |
| | Remove sample photo for all | 0.0 ms | items: 14 |
| | Render result | 0.0 ms | items: 14 |
| **Searching for `a` as `directory`** | | **272.8 ms** | **media: 1679, directories:21** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.1 ms | - |
| | Search | 150.1 ms | media: 1679, directories:21 |
| | Add thumbnail information | 113.6 ms | media: 1679, directories:21 |
| | Clean up gallery results | 8.9 ms | media: 1679, directories:21 |
| | Render result | 0.0 ms | media: 1679, directories:21 |
| **Searching for `a` as `person`** | | **145.0 ms** | **media: 768, directories:21** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.1 ms | - |
| | Search | 89.2 ms | media: 768, directories:21 |
| | Add thumbnail information | 51.3 ms | media: 768, directories:21 |
| | Clean up gallery results | 4.4 ms | media: 768, directories:21 |
| | Render result | 0.0 ms | media: 768, directories:21 |
| **Searching for `a` as `keyword`** | | **243.1 ms** | **media: 1534, directories:21** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.1 ms | - |
| | Search | 132.1 ms | media: 1534, directories:21 |
| | Add thumbnail information | 102.6 ms | media: 1534, directories:21 |
| | Clean up gallery results | 8.2 ms | media: 1534, directories:21 |
| | Render result | 0.0 ms | media: 1534, directories:21 |
| **Searching for `a` as `position`** | | **195.9 ms** | **media: 1133, directories:21** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.1 ms | - |
| | Search | 113.1 ms | media: 1133, directories:21 |
| | Add thumbnail information | 77.1 ms | media: 1133, directories:21 |
| | Clean up gallery results | 5.5 ms | media: 1133, directories:21 |
| | Render result | 0.0 ms | media: 1133, directories:21 |
| **Searching for `a` as `photo`** | | **14.8 ms** | **media: 65, directories:21** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.0 ms | - |
| | Search | 9.7 ms | media: 65, directories:21 |
| | Add thumbnail information | 4.5 ms | media: 65, directories:21 |
| | Clean up gallery results | 0.4 ms | media: 65, directories:21 |
| | Render result | 0.0 ms | media: 65, directories:21 |
| **Searching for `a` as `video`** | | **6.5 ms** | **media: 14, directories:21** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.0 ms | - |
| | Search | 5.3 ms | media: 14, directories:21 |
| | Add thumbnail information | 1.0 ms | media: 14, directories:21 |
| | Clean up gallery results | 0.1 ms | media: 14, directories:21 |
| | Render result | 0.0 ms | media: 14, directories:21 |
| **Searching for `a` as `any`** | | **330.6 ms** | **media: 2001, directories:21** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.1 ms | - |
| | Search | 185.8 ms | media: 2001, directories:21 |
| | Add thumbnail information | 133.9 ms | media: 2001, directories:21 |
| | Clean up gallery results | 10.7 ms | media: 2001, directories:21 |
| | Render result | 0.0 ms | media: 2001, directories:21 |
| **Instant search for `a`** | | **7.4 ms** | **media: 10, directories:10** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.0 ms | - |
| | Instant search | 6.5 ms | media: 10, directories:10 |
| | Add thumbnail information | 0.8 ms | media: 10, directories:10 |
| | Clean up gallery results | 0.1 ms | media: 10, directories:10 |
| | Render result | 0.0 ms | media: 10, directories:10 |
| **Auto complete for `a`** | | **8.3 ms** | **items: 35** |
| | Authenticate | 0.0 ms | - |
| | Authorise | 0.0 ms | - |
| | Inject gallery version | 0.0 ms | - |
| | Autocomplete | 8.2 ms | items: 35 |
| | Render result | 0.0 ms | items: 35 |
*Measurements run 50 times, and an average was calculated.


## PiGallery2 v1.5.8, 26.01.2019

**System**: Intel(R) Core(TM) i7-6700HQ CPU @ 2.60GHz, 16GB Ram, SHDD: 1TB, 5400 rpm
**Gallery**: directories: 0 media: 341, faces: 39

| action | action details | average time | details |
|:------:|:--------------:|:------------:|:-------:|
| Scanning directory |  | 2486.5ms | media: 341, directories:0 |
| Saving directory |  | 780.0ms | - |
| Listing Directory |  | 31.5ms | media: 341, directories:0 |
| searching | `a` as `directory` | 2.9ms | - |
| searching | `a` as `person` | 7.3ms | media: 39, directories:0 |
| searching | `a` as `keyword` | 30.8ms | media: 339, directories:0 |
| searching | `a` as `position` | 25.7ms | media: 282, directories:0 |
| searching | `a` as `photo` | 2.8ms | - |
| searching | `a` as `video` | 2.6ms | - |
| searching | `a` as `any` | 33.0ms | media: 339, directories:0 |
| instant search | `a` | 6.1ms | media: 10, directories:0 |
| auto complete | `a` | 5.4ms | items: 10 | 
