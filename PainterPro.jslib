mergeInto(LibraryManager.library, {

    InitJSBridge: function() {
        var gameObject = 'Main Camera';

        window.addEventListener('message', function(e) {
            var msg = e.data;
            if (!msg || msg.type !== 'FromParent') return;

            if (msg.action === 'ApplySaaSFinish' && msg.payload) {
                SendMessage(gameObject, 'ApplySaaSFinish', msg.payload);
            }
            else if (msg.action === 'SetMaterialColor' && msg.payload) {
                SendMessage(gameObject, 'SetMaterialColor', msg.payload);
            }
            else if (msg.action === 'SetMaterialTexture' && msg.payload) {
                SendMessage(gameObject, 'SetMaterialTexture', msg.payload);
            }
            else if (msg.action === 'SetTiling' && msg.payload) {
                SendMessage(gameObject, 'SetTiling', msg.payload);
            }
            else if (msg.action === 'SetRotation' && msg.payload) {
                SendMessage(gameObject, 'SetRotation', msg.payload);
            }
            else if (msg.action === 'SetRoughness' && msg.payload) {
                SendMessage(gameObject, 'SetRoughness', msg.payload);
            }
            else if (msg.action === 'SetMetallic' && msg.payload) {
                SendMessage(gameObject, 'SetMetallic', msg.payload);
            }
            else if (msg.action === 'RestoreOriginals') {
                SendMessage(gameObject, 'RestoreOriginals', '');
            }
            else if (msg.action === 'CaptureScreenshot') {
                SendMessage(gameObject, 'CaptureScreenshot', '');
            }
            else if (msg.action === 'LoadGLBFromUrl' && msg.payload) {
                SendMessage(gameObject, 'LoadGLBFromUrl', msg.payload);
            }
            else if (msg.action === 'LoadDefaultModel') {
                SendMessage(gameObject, 'LoadDefaultModel', '');
            }
            else if (msg.action === 'ForceDeselect') {
                SendMessage(gameObject, 'ForceDeselect', '');
            }
            else if (msg.action === 'RestoreSlotOriginal' && msg.payload) {
                SendMessage(gameObject, 'RestoreSlotOriginal', msg.payload);
            }
        });

        console.log('[JSlib] InitJSBridge registered.');
    },

    OnObjectSelected: function(name, matCount) {
        var nameStr = UTF8ToString(name);
        console.log('[JSlib] OnObjectSelected:', nameStr, '| slots:', matCount);
        window.parent.postMessage({
            type:     'FromUnity',
            action:   'ObjectSelected',
            payload:  nameStr,
            matCount: matCount
        }, '*');
    },

    NotifyTextureApplied: function() {
        window.parent.postMessage({
            type: 'FromUnity',
            action: 'TextureApplied'
        }, '*');
    },

    DownloadFile: function(array, size, fileName) {
        var bytes = new Uint8Array(Module.HEAPU8.buffer, array, size);
        var blob  = new Blob([bytes], { type: 'image/png' });
        var url = window.URL.createObjectURL(blob);
        window.parent.postMessage({
            type: 'FromUnity',
            action: 'Process4KScreenshot',
            payload: url
        }, '*');
    }

});