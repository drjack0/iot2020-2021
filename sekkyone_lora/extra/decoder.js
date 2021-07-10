function Decoder(bytes, port) {
    return {
        decoded: String.fromCharCode.apply(null, bytes)
    };
}