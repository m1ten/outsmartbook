# OutSmartBook

## Out of the box experience for McGraw Hill SmartBooks

### Building for Different Browsers

The extension uses different manifest configurations for Chrome and Firefox. Use the build script to generate browser-specific files:

```sh
node build.js
```

This will create two zip files in the build directory:

- `build/outsmartbook-chrome.zip` - Chrome-compatible extension
- `build/outsmartbook-firefox.zip` - Firefox-compatible extension

### Installation

#### Chrome

1. Build the extension using the build script
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer Mode"
4. Extract the `outsmartbook-chrome.zip` file
5. Click "Load unpacked" and select the extracted directory
6. Start ollama with Chrome permissions:

```sh
OLLAMA_ORIGINS=chrome-extension://* ollama serve
```

#### Firefox

1. Build the extension using the build script
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click on "Load Temporary Add-on..."
4. Select the `outsmartbook-firefox.zip` file
5. Start ollama with Firefox origin permissions:

```sh
OLLAMA_ORIGINS=moz-extension://* ollama serve
```

Note: For permanent installation, the extension needs to be signed and published on Firefox Add-ons.

### Roadmap

- [x] Add Firefox support
- [ ] Give Llama access to chapters
- [ ] Add Quizlet support

### Acknowledgements

- Original project at [smarterbook](https://github.com/micahlt/smarterbook) by [@micahlt](https://github.com/micahlt).
- [llama](https://llama.com/) and [ollama](https://ollama.com/) for making this possible.

### License

[MIT](LICENSE) - Unlike certain educational materials that cost a kidney.

Note: Only my code is licensed under MIT. The original project by @micahlt is unlicensed, so use it at your own risk.

This extension is not affiliated with or endorsed by McGraw Hill. It is a personal project created for educational purposes only. Use at your own risk.

### Joke

Thanks to McGraw Hill for inspiring this project by making textbooks so tedious that even llama couldn't read them. Fun fact: Llama is a type of camelid, and McGraw Hill textbooks are often referred to as "camel" books because they can be a bit of a "hump" to get through. So, in a way, this project is like giving a llama a break from all that heavy lifting! Lol, get it? Llama, camel, books... ok, I'll stop now.
