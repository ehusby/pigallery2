# PiGallery2 performance benchmark results

These results are created mostly for development, but the results are public for curious users.

You can also run it on your files by using the [docker-compose.yml](docker-compose) file.

See all benchmark results in [HISTORY.md](HISTORY.md)

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

