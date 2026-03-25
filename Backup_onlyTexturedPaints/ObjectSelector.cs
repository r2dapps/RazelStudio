
#region this code need to be added for base texture

//using UnityEngine;
//using System.Collections;
//using UnityEngine.Networking;

//// This class handles the PBR data from your JSON
//[System.Serializable]
//public class TextureData
//{
//    public string baseId;
//    public string albedoPath;
//    public string normalPath;
//    public string roughnessPath;
//}

//public partial class ObjectSelector : MonoBehaviour
//{

//    // Call this from JS when a Base Texture (Stucco, Concrete, etc) is picked
//    // Payload: "slotIndex|albedoUrl|normalUrl|roughnessUrl"
//    public void SetBaseTexture(string data)
//    {
//        if (_currentSelected == null) return;
//        string[] parts = data.Split('|');
//        int slot = int.Parse(parts[0]);

//        StartCoroutine(LoadPBRMaterials(slot, parts[1], parts[2], parts[3]));
//    }

//    private IEnumerator LoadPBRMaterials(int slot, string aUrl, string nUrl, string rUrl)
//    {
//        // Run downloads in parallel
//        UnityWebRequest aReq = UnityWebRequestTexture.GetTexture(aUrl);
//        UnityWebRequest nReq = UnityWebRequestTexture.GetTexture(nUrl);
//        UnityWebRequest rReq = UnityWebRequestTexture.GetTexture(rUrl);

//        yield return aReq.SendWebRequest();
//        yield return nReq.SendWebRequest();
//        yield return rReq.SendWebRequest();

//        if (aReq.result == UnityWebRequest.Result.Success)
//        {
//            Texture2D albedo = DownloadHandlerTexture.GetContent(aReq);
//            Texture2D normal = DownloadHandlerTexture.GetContent(nReq);
//            Texture2D roughness = DownloadHandlerTexture.GetContent(rReq);

//            foreach (var r in _selectedRenderers)
//            {
//                MaterialPropertyBlock block = new MaterialPropertyBlock();
//                r.GetPropertyBlock(block, slot);

//                // Set the Maps (Using URP standard naming)
//                block.SetTexture("_BaseMap", albedo);
//                block.SetTexture("_BumpMap", normal);
//                block.SetTexture("_RoughnessMap", roughness); // Ensure your shader supports this

//                r.SetPropertyBlock(block, slot);
//            }
//        }
//    }
//}
#endregion
using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Globalization;
using UnityEngine.Networking;
using UnityEngine.EventSystems;

public class ObjectSelector : MonoBehaviour
{
    // ---------------------------------------------------------------
    // JS INTEROP — implemented in Assets/Plugins/PainterPro.jslib
    // ---------------------------------------------------------------
    [DllImport("__Internal")] private static extern void InitJSBridge();
    [DllImport("__Internal")] private static extern void OnObjectSelected(string name, int materialCount);
    [DllImport("__Internal")] private static extern void DownloadFile(byte[] array, int size, string fileName);

    [DllImport("__Internal")] private static extern void NotifyTextureApplied();

    // ---------------------------------------------------------------
    // C# EVENT — consumed by WalkthroughCamera and any other listener.
    // Fired with true on selection, false on deselect.
    // Works in ALL build targets (Editor, Standalone, WebGL).
    // ---------------------------------------------------------------
    public static event System.Action<bool> OnSelectionChanged;

    // ---------------------------------------------------------------
    // INSPECTOR
    // ---------------------------------------------------------------
    public Material outlineMaterial;

    [Header("Reflection ProbSetup")]
    public ReflectionProbe roomProbe;

    // ---------------------------------------------------------------
    // RUNTIME STATE
    // ---------------------------------------------------------------
    private GameObject _currentSelected;
    private List<Renderer> _selectedRenderers = new List<Renderer>();
    private Dictionary<Renderer, Material[]> _originalMaterialCache = new Dictionary<Renderer, Material[]>();
    // Cache to prevent the Out-Of-Memory Crash by avoiding duplicate downloads
    private Dictionary<string, string> _appliedTextures = new Dictionary<string, string>();
    // ---------------------------------------------------------------
    // UNITY LIFECYCLE
    // ---------------------------------------------------------------

    [ContextMenu("Test: Random SaaS Finish (Slot 0)")]
    public void TestRandomSaaSFinish()
    {
        if (_currentSelected == null)
        {
            Debug.LogWarning("[Razel Studio] Please click/select a wall in the Game View first!");
            return;
        }

        string basePath = System.IO.Path.Combine(Application.streamingAssetsPath, "TexturedPaints");
        string selectedFolder = "NONE";

        // 80% chance to pick a random texture, 20% chance to test a "Flat Paint" (NONE)
        if (Random.value > 0.2f && System.IO.Directory.Exists(basePath))
        {
            string[] directories = System.IO.Directory.GetDirectories(basePath);
            if (directories.Length > 0)
            {
                // Get just the folder name (e.g., "Micro-Concrete")
                selectedFolder = new System.IO.DirectoryInfo(directories[Random.Range(0, directories.Length)]).Name;
            }
        }

        // Generate random UI parameters
        Color randomColor = Random.ColorHSV(0f, 1f, 0.1f, 0.6f, 0.5f, 1f); // Pleasant architectural colors
        string hexColor = "#" + ColorUtility.ToHtmlStringRGB(randomColor);

        float smooth = Random.Range(0.05f, 0.95f);
        float metallic = Random.value > 0.7f ? Random.Range(0.5f, 1.0f) : 0.0f; // 30% chance to be metallic
        float tiling = Random.Range(0.5f, 3.0f);
        //float normStr = Random.Range(0.2f, 1.8f);
        // Change it to exactly 2:
        float normStr = 2.0f;
        // Format: Slot|Path|Hex|Smooth|Metal|Tiling|NormalStr
        string payloadPath = selectedFolder == "NONE" ? "NONE" : "StreamingAssets/TexturedPaints/" + selectedFolder;

        string payload = string.Format(CultureInfo.InvariantCulture,
            "0|{0}|{1}|{2:F2}|{3:F2}|{4:F2}|{5:F2}",
            payloadPath, hexColor, smooth, metallic, tiling, normStr);

        Debug.Log("🧪 [Test Payload Created]: " + payload);

        // Feed it directly into our new production pipeline!
        ApplySaaSFinish(payload);
    }
    void Start()
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        // Register the browser message listener via jslib.
        // Start() fires before unity.html sends "UnityReady", so the listener
        // is registered before the parent ever flushes its message queue.
        InitJSBridge();
#endif
#if UNITY_WEBGL && !UNITY_EDITOR
    Application.ExternalEval("window.parent.postMessage({type:'FromUnity', action:'SceneLoaded'}, '*')");
#endif
    }

    // ---------------------------------------------------------------
    // CONTEXT MENU TESTS (Editor only)
    // ---------------------------------------------------------------
    [ContextMenu("Test: Set Red (Slot 0)")]
    public void TestRed() => SetMaterialColor("0|#FF0000");

    [ContextMenu("Test: Rotation 45° (Slot 0)")]
    public void TestRotation45() => SetRotation("0|45");

    [ContextMenu("Test: Rotation 90° (Slot 0)")]
    public void TestRotation90() => SetRotation("0|90");

    [ContextMenu("Test: Reset Rotation (Slot 0)")]
    public void TestRotationReset() => SetRotation("0|0");

    [ContextMenu("Test: Restore Originals")]
    public void ManualRestore() => RestoreOriginals();

    [ContextMenu("Test: Deselect")]
    public void TestDeselect() => DeselectCurrent();

    // ---------------------------------------------------------------
    // UPDATE — INPUT
    // ---------------------------------------------------------------
    //void Update()
    //{
    //    // Escape = deselect current object
    //    if (Input.GetKeyDown(KeyCode.Escape))
    //    {
    //        DeselectCurrent();
    //        return;
    //    }

    //    // Left-click = raycast select / deselect
    //    if (Input.GetMouseButtonDown(0))
    //    {
    //        Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
    //        if (Physics.Raycast(ray, out RaycastHit hit))
    //            Select(hit.collider.gameObject);
    //        else
    //            DeselectCurrent(); // clicked into empty space
    //    }
    //}

    //for touch
    void Update()
    {
        // 1. PC: Escape Key Deselect
        if (Input.GetKeyDown(KeyCode.Escape))
        {
            DeselectCurrent();
            return;
        }

        // 2. Prevent selecting objects if clicking/tapping on the Unity UI Canvas (if any)
        if (EventSystem.current != null && EventSystem.current.IsPointerOverGameObject())
            return;

        // 3. Handle Mobile Touch strictly
        if (Application.isMobilePlatform)
        {
            if (Input.touchCount > 0)
            {
                Touch touch = Input.GetTouch(0);
                // Only select if it's a quick tap (Phase Began)
                if (touch.phase == TouchPhase.Began)
                {
                    // Double-check UI hit for the specific finger
                    if (EventSystem.current != null && EventSystem.current.IsPointerOverGameObject(touch.fingerId)) return;

                    PerformRaycast(touch.position);
                }
            }
        }
        // 4. Handle PC Mouse Click strictly
        else
        {
            if (Input.GetMouseButtonDown(0))
            {
                PerformRaycast(Input.mousePosition);
            }
        }
    }

    // Helper method to keep code clean
    private void PerformRaycast(Vector2 screenPos)
    {
        Ray ray = Camera.main.ScreenPointToRay(screenPos);
        if (Physics.Raycast(ray, out RaycastHit hit))
            Select(hit.collider.gameObject);
        else
            DeselectCurrent(); // Clicked empty space
    }

    // ADD THIS: For the HTML UI to force a deselect (The Mobile "Escape" equivalent)
    public void ForceDeselect(string _)
    {
        DeselectCurrent();
    }

    // ---------------------------------------------------------------
    // SELECTION — injects outline material slot
    // ---------------------------------------------------------------
    public void Select(GameObject target)
    {
        if (target == _currentSelected) return;

        DeselectCurrent();

        _currentSelected = target;
        Renderer[] rends = _currentSelected.GetComponentsInChildren<Renderer>();
        if (rends.Length == 0) return;

        foreach (var r in rends)
        {
            _originalMaterialCache[r] = r.sharedMaterials;
            _selectedRenderers.Add(r);

            Material[] newMats = new Material[r.sharedMaterials.Length + 1];
            for (int i = 0; i < r.sharedMaterials.Length; i++)
                newMats[i] = r.sharedMaterials[i];
            newMats[newMats.Length - 1] = outlineMaterial;
            r.sharedMaterials = newMats;
        }

#if UNITY_WEBGL && !UNITY_EDITOR
        OnObjectSelected(_currentSelected.name, _originalMaterialCache[rends[0]].Length);
#endif
        OnSelectionChanged?.Invoke(true);   // notify WalkthroughCamera etc.
    }

    public void DeselectCurrent()
    {
        if (_currentSelected == null) return;

        foreach (var r in _selectedRenderers)
        {
            if (r != null && _originalMaterialCache.ContainsKey(r))
                r.sharedMaterials = _originalMaterialCache[r];
        }

        _selectedRenderers.Clear();
        _originalMaterialCache.Clear();
        _currentSelected = null;

#if UNITY_WEBGL && !UNITY_EDITOR
        OnObjectSelected("", 0);
#endif
        OnSelectionChanged?.Invoke(false);
    }

    // ---------------------------------------------------------------
    // RESTORE — clears property block overrides, keeps selection
    // ---------------------------------------------------------------
    public void RestoreOriginals()
    {
        // clear all property block overrides
        foreach (var r in _selectedRenderers)
            if (r != null) ClearPropertyBlocks(r);

        if (roomProbe != null) roomProbe.RenderProbe();
    }

    private void ClearPropertyBlocks(Renderer r)
    {
        if (!_originalMaterialCache.ContainsKey(r)) return;
        int originalCount = _originalMaterialCache[r].Length;
        for (int i = 0; i < originalCount; i++)
            r.SetPropertyBlock(null, i);
    }

    // ---------------------------------------------------------------
    // 4K SCREENSHOT — triggered by browser "Download 4K" button
    // Payload: ignored (can be empty string)
    // ---------------------------------------------------------------
    public void CaptureScreenshot(string _)
    {
        StartCoroutine(Capture4K());
    }

    private IEnumerator Capture4K()
    {
        yield return new WaitForEndOfFrame();

        // Render at 4× supersampling (≈3840×2160 at a 1920×1080 viewport)
        int scale = 4;
        int w = Screen.width * scale;
        int h = Screen.height * scale;

        RenderTexture rt = new RenderTexture(w, h, 24, RenderTextureFormat.ARGB32);
        rt.antiAliasing = 4;

        Camera cam = Camera.main;
        cam.targetTexture = rt;
        cam.Render();

        RenderTexture.active = rt;
        Texture2D tex = new Texture2D(w, h, TextureFormat.RGB24, false);
        tex.ReadPixels(new Rect(0, 0, w, h), 0, 0);
        tex.Apply();

        cam.targetTexture = null;
        RenderTexture.active = null;
        Destroy(rt);

        byte[] bytes = tex.EncodeToPNG();
        Destroy(tex);

#if UNITY_WEBGL && !UNITY_EDITOR
        DownloadFile(bytes, bytes.Length, "PainterPro_4K.png");
#else
        System.IO.File.WriteAllBytes(
            System.IO.Path.Combine(Application.persistentDataPath, "PainterPro_4K.png"), bytes);
        Debug.Log("[ObjectSelector] 4K screenshot saved to: " + Application.persistentDataPath);
#endif
    }

    // ---------------------------------------------------------------
    // COLOR   payload: "slotIndex|#RRGGBB"
    // ---------------------------------------------------------------
    public void SetMaterialColor(string data)
    {
        if (_currentSelected == null) return;
        string[] parts = data.Split('|');
        int index = int.Parse(parts[0]);
        string hex = parts[1];

        if (ColorUtility.TryParseHtmlString(hex, out Color col))
        {
            foreach (var r in _selectedRenderers)
            {
                if (index >= r.sharedMaterials.Length) continue;
                MaterialPropertyBlock block = new MaterialPropertyBlock();
                r.GetPropertyBlock(block, index);
                block.SetColor("baseColorFactor", col); // glTF Standard
                block.SetColor("_BaseColor", col);       // URP Lit
                r.SetPropertyBlock(block, index);
            }
        }
        if (roomProbe != null) roomProbe.RenderProbe();
    }

    // ---------------------------------------------------------------
    // TEXTURE   payload: "slotIndex|url"
    // ---------------------------------------------------------------
    public void SetMaterialTexture(string data)
    {
        if (_currentSelected == null) return;
        string[] parts = data.Split('|');
        int index = int.Parse(parts[0]);
        string url = parts[1];
        StartCoroutine(DownloadAndApplyTexture(url, index));
    }

    private IEnumerator DownloadAndApplyTexture(string url, int index)
    {
        using (UnityWebRequest uwr = UnityWebRequestTexture.GetTexture(url))
        {
            yield return uwr.SendWebRequest();
            if (uwr.result == UnityWebRequest.Result.Success)
            {
                Texture2D tex = DownloadHandlerTexture.GetContent(uwr);
                foreach (var r in _selectedRenderers)
                {
                    if (index >= r.sharedMaterials.Length) continue;
                    MaterialPropertyBlock block = new MaterialPropertyBlock();
                    r.GetPropertyBlock(block, index);
                    block.SetTexture("baseColorTexture", tex);
                    block.SetColor("baseColorFactor", Color.white);
                    block.SetTexture("_BaseMap", tex);
                    block.SetColor("_BaseColor", Color.white);
                    r.SetPropertyBlock(block, index);
                }
                if (roomProbe != null) roomProbe.RenderProbe();
            }
            else
            {
                Debug.LogWarning("[ObjectSelector] Texture download failed: " + uwr.error);
            }
        }
    }

    // ---------------------------------------------------------------
    // TILING   payload: "slotIndex|value"
    // ---------------------------------------------------------------
    public void SetTiling(string data)
    {
        if (_currentSelected == null) return;
        string[] parts = data.Split('|');
        int index = int.Parse(parts[0]);
        float tiling = float.Parse(parts[1], CultureInfo.InvariantCulture);

        foreach (var r in _selectedRenderers)
        {
            if (index >= r.sharedMaterials.Length) continue;
            MaterialPropertyBlock block = new MaterialPropertyBlock();
            r.GetPropertyBlock(block, index);
            block.SetVector("_BaseMap_ST", new Vector4(tiling, tiling, 0f, 0f));
            r.SetPropertyBlock(block, index);
        }
        if (roomProbe != null) roomProbe.RenderProbe();
    }

    // ---------------------------------------------------------------
    // ROTATION   payload: "slotIndex|degrees"
    // ---------------------------------------------------------------
    public void SetRotation(string data)
    {
        if (_currentSelected == null) return;
        string[] parts = data.Split('|');
        int index = int.Parse(parts[0]);
        float degrees = float.Parse(parts[1], CultureInfo.InvariantCulture);
        float radians = degrees * Mathf.Deg2Rad;

        foreach (var r in _selectedRenderers)
        {
            if (index >= r.sharedMaterials.Length) continue;

            MaterialPropertyBlock block = new MaterialPropertyBlock();
            r.GetPropertyBlock(block, index);
            block.SetFloat("_BaseMap_Rotation", radians);
            r.SetPropertyBlock(block, index);
        }
        if (roomProbe != null) roomProbe.RenderProbe();
    }

    // ---------------------------------------------------------------
    // ROUGHNESS   payload: "slotIndex|0..1"
    // URP: Smoothness = 1 - Roughness
    // ---------------------------------------------------------------
    public void SetRoughness(string data)
    {
        if (_currentSelected == null) return;
        string[] parts = data.Split('|');
        int index = int.Parse(parts[0]);
        float roughness = float.Parse(parts[1], CultureInfo.InvariantCulture);

        foreach (var r in _selectedRenderers)
        {
            if (index >= r.sharedMaterials.Length) continue;
            MaterialPropertyBlock block = new MaterialPropertyBlock();
            r.GetPropertyBlock(block, index);
            block.SetFloat("_Smoothness", 1f - roughness);
            r.SetPropertyBlock(block, index);
        }
        if (roomProbe != null) roomProbe.RenderProbe();
    }

    // ---------------------------------------------------------------
    // METALLIC   payload: "slotIndex|0..1"
    // ---------------------------------------------------------------
    public void SetMetallic(string data)
    {
        if (_currentSelected == null) return;
        string[] parts = data.Split('|');
        int index = int.Parse(parts[0]);
        float metallic = float.Parse(parts[1], CultureInfo.InvariantCulture);

        foreach (var r in _selectedRenderers)
        {
            if (index >= r.sharedMaterials.Length) continue;
            MaterialPropertyBlock block = new MaterialPropertyBlock();
            r.GetPropertyBlock(block, index);
            block.SetFloat("_Metallic", metallic);
            r.SetPropertyBlock(block, index);
        }
        if (roomProbe != null) roomProbe.RenderProbe();
    }

    //added for richwaves demo
    // ---------------------------------------------------------------
    // PRODUCTION PBR UPDATE (Step 5)
    // Payload: "SlotIndex|TexturePath|HexColor|Smoothness|Metallic|Tiling"
    // ---------------------------------------------------------------

    // ---------------------------------------------------------------
    // PRODUCTION PBR UPDATE (Step 5)
    // ---------------------------------------------------------------
    public void ApplySaaSFinish(string data)
    {
        if (_currentSelected == null) return;

        string[] parts = data.Split('|');
        if (parts.Length < 7) return;

        int slot = int.Parse(parts[0]);
        string folderUrl = parts[1];
        string hex = parts[2];
        float smooth = float.Parse(parts[3], CultureInfo.InvariantCulture);
        float metallic = float.Parse(parts[4], CultureInfo.InvariantCulture);
        float tiling = float.Parse(parts[5], CultureInfo.InvariantCulture);
        float normStr = float.Parse(parts[6], CultureInfo.InvariantCulture);

        string trackingKey = _currentSelected.name + "_" + slot;

        if (ColorUtility.TryParseHtmlString(hex, out Color col))
        {
            foreach (var r in _selectedRenderers)
            {
                if (slot >= r.sharedMaterials.Length) continue;
                MaterialPropertyBlock block = new MaterialPropertyBlock();
                r.GetPropertyBlock(block, slot);

                block.SetColor("_BaseColor", col);
                block.SetFloat("_Smoothness", smooth);
                block.SetFloat("_Metallic", metallic);
                block.SetFloat("_BumpScale", normStr);
                block.SetVector("_BaseMap_ST", new Vector4(tiling, tiling, 0, 0));
                block.SetVector("_BumpMap_ST", new Vector4(tiling, tiling, 0, 0));

                // 1. Flat Paint Mode (If texture is NONE, clear the images)
                if (folderUrl == "NONE" || string.IsNullOrEmpty(folderUrl))
                {
                    block.SetTexture("_BaseMap", Texture2D.whiteTexture);
                    block.SetTexture("_BumpMap", Texture2D.normalTexture);
                }

                r.SetPropertyBlock(block, slot);
            }
        }

        // 2. Stop here if it's a flat paint (no download needed)
        if (folderUrl == "NONE" || string.IsNullOrEmpty(folderUrl))
        {
            _appliedTextures[trackingKey] = "NONE";
            if (roomProbe != null) roomProbe.RenderProbe();
            return;
        }

        // 3. Texture Caching (Prevents the 2GB Memory Crash when sliding/clicking)
        if (!_appliedTextures.ContainsKey(trackingKey) || _appliedTextures[trackingKey] != folderUrl)
        {
            _appliedTextures[trackingKey] = folderUrl; // Save to cache
            StartCoroutine(LoadPBRStreaming(slot, folderUrl)); // Download
        }
    }

    private IEnumerator LoadPBRStreaming(int slot, string folder)
    {
        string basePath = folder;

#if UNITY_EDITOR
        // Fix for Editor Play Mode: UnityWebRequest needs an absolute file URI locally
        if (basePath.StartsWith("StreamingAssets"))
        {
            // Combine Application.dataPath (which is the Assets folder) with the StreamingAssets string
            string absolutePath = System.IO.Path.Combine(Application.dataPath, basePath);

            // Convert it to a proper file:// URI so UnityWebRequest can read it (handles spaces perfectly)
            basePath = new System.Uri(absolutePath).AbsoluteUri;
        }
#endif

        string albedoUrl = $"{basePath}/Color.jpg";
        string normalUrl = $"{basePath}/NormalGL.jpg";

        // Albedo can be loaded normally
        using (UnityWebRequest aReq = UnityWebRequestTexture.GetTexture(albedoUrl))
        // Normal Map must be loaded as raw bytes to force Linear Color Space
        using (UnityWebRequest nReq = UnityWebRequest.Get(normalUrl))
        {
            yield return aReq.SendWebRequest();
            yield return nReq.SendWebRequest();

            if (aReq.result == UnityWebRequest.Result.Success)
            {
                Texture2D albedo = DownloadHandlerTexture.GetContent(aReq);
                Texture2D normal = null;

                // Dynamically build the Normal Map in Linear Space
                if (nReq.result == UnityWebRequest.Result.Success)
                {
                    byte[] normalData = nReq.downloadHandler.data;
                    // The 'true, true' at the end forces Linear Space and MipMaps
                    normal = new Texture2D(2, 2, TextureFormat.RGBA32, true, true);
                    normal.LoadImage(normalData);
                }

                foreach (var r in _selectedRenderers)
                {
                    if (slot >= r.sharedMaterials.Length) continue;
                    MaterialPropertyBlock block = new MaterialPropertyBlock();
                    r.GetPropertyBlock(block, slot);

                    block.SetTexture("_BaseMap", albedo);
                    if (normal != null) block.SetTexture("_BumpMap", normal);

                    r.SetPropertyBlock(block, slot);
                }

                if (roomProbe != null) roomProbe.RenderProbe();
            }
            else
            {
                Debug.LogWarning($"[ObjectSelector] Base Texture download failed: {aReq.error} | URL: {albedoUrl}");
            }
        }

#if UNITY_WEBGL && !UNITY_EDITOR
        NotifyTextureApplied(); 
#endif
    }
    #region old code(working fine, but dont have normal map conversion)
    //public void ApplySaaSFinish(string data)
    //{
    //    if (_currentSelected == null) return;

    //    string[] parts = data.Split('|');
    //    if (parts.Length < 7) return; // Increased to 7 for Normal Strength

    //    int slot = int.Parse(parts[0]);
    //    string folderUrl = parts[1];
    //    string hex = parts[2];
    //    float smooth = float.Parse(parts[3], CultureInfo.InvariantCulture);
    //    float metallic = float.Parse(parts[4], CultureInfo.InvariantCulture);
    //    float tiling = float.Parse(parts[5], CultureInfo.InvariantCulture);
    //    float normStr = float.Parse(parts[6], CultureInfo.InvariantCulture); // NEW

    //    if (ColorUtility.TryParseHtmlString(hex, out Color col))
    //    {
    //        foreach (var r in _selectedRenderers)
    //        {
    //            if (slot >= r.sharedMaterials.Length) continue;
    //            MaterialPropertyBlock block = new MaterialPropertyBlock();
    //            r.GetPropertyBlock(block, slot);

    //            block.SetColor("_BaseColor", col);
    //            block.SetFloat("_Smoothness", smooth);
    //            block.SetFloat("_Metallic", metallic);
    //            block.SetFloat("_BumpScale", normStr); // NEW: Applies depth
    //            block.SetVector("_BaseMap_ST", new Vector4(tiling, tiling, 0, 0));
    //            block.SetVector("_BumpMap_ST", new Vector4(tiling, tiling, 0, 0)); // Match tiling

    //            r.SetPropertyBlock(block, slot);
    //        }
    //    }

    //    // Pass the folder to the improved coroutine
    //    StartCoroutine(LoadPBRStreaming(slot, folderUrl));
    //} 
    #endregion
    #region old code commented because added new code for normalmap conversion
    //    private IEnumerator LoadPBRStreaming(int slot, string folder)
    //    {
    //        string albedoUrl = $"{folder}/Color.jpg";
    //        string normalUrl = $"{folder}/NormalGL.jpg"; // Match your naming convention

    //        using (UnityWebRequest aReq = UnityWebRequestTexture.GetTexture(albedoUrl))
    //        using (UnityWebRequest nReq = UnityWebRequestTexture.GetTexture(normalUrl))
    //        {
    //            yield return aReq.SendWebRequest();
    //            yield return nReq.SendWebRequest();

    //            if (aReq.result == UnityWebRequest.Result.Success)
    //            {
    //                Texture2D albedo = DownloadHandlerTexture.GetContent(aReq);
    //                Texture2D normal = nReq.result == UnityWebRequest.Result.Success ? DownloadHandlerTexture.GetContent(nReq) : null;

    //                foreach (var r in _selectedRenderers)
    //                {
    //                    if (slot >= r.sharedMaterials.Length) continue;
    //                    MaterialPropertyBlock block = new MaterialPropertyBlock();
    //                    r.GetPropertyBlock(block, slot);

    //                    block.SetTexture("_BaseMap", albedo);
    //                    if (normal != null) block.SetTexture("_BumpMap", normal); // Apply the bumps!

    //                    r.SetPropertyBlock(block, slot);
    //                }
    //                if (roomProbe != null) roomProbe.RenderProbe();
    //            }
    //            else
    //            {
    //                Debug.LogWarning("[ObjectSelector] Base Texture download failed: " + aReq.error);
    //            }
    //        }

    //#if UNITY_WEBGL && !UNITY_EDITOR
    //        NotifyTextureApplied(); 
    //#endif
    //    } 
    #endregion
}



#region working fine but need to modify the shader so commented to remove and keep remaining logics
//using UnityEngine;
//using System.Collections;
//using System.Collections.Generic;
//using System.Runtime.InteropServices;
//using System.Globalization;
//using UnityEngine.Networking;

//public class ObjectSelector : MonoBehaviour
//{
//    // ---------------------------------------------------------------
//    // JS INTEROP — implemented in Assets/Plugins/PainterPro.jslib
//    // ---------------------------------------------------------------
//    [DllImport("__Internal")] private static extern void InitJSBridge();
//    [DllImport("__Internal")] private static extern void OnObjectSelected(string name, int materialCount);
//    [DllImport("__Internal")] private static extern void DownloadFile(byte[] array, int size, string fileName);

//    // ---------------------------------------------------------------
//    // C# EVENT — consumed by WalkthroughCamera and any other listener.
//    // Fired with true on selection, false on deselect.
//    // Works in ALL build targets (Editor, Standalone, WebGL).
//    // ---------------------------------------------------------------
//    public static event System.Action<bool> OnSelectionChanged;

//    // ---------------------------------------------------------------
//    // INSPECTOR
//    // ---------------------------------------------------------------
//    public Material outlineMaterial;


//    // ---------------------------------------------------------------
//    // RUNTIME STATE
//    // ---------------------------------------------------------------
//    private GameObject _currentSelected;
//    private List<Renderer> _selectedRenderers = new List<Renderer>();
//    private Dictionary<Renderer, Material[]> _originalMaterialCache = new Dictionary<Renderer, Material[]>();

//    // Tracks temporary material instances created by EnsureRotatableShader()
//    // so they can be properly destroyed on deselect / restore.
//    private readonly HashSet<Material> _createdMaterials = new HashSet<Material>();
//    private const string RotatableShaderName = "PainterPro/RotatableLit";

//    // ---------------------------------------------------------------
//    // UNITY LIFECYCLE
//    // ---------------------------------------------------------------
//    void Start()
//    {
//#if UNITY_WEBGL && !UNITY_EDITOR
//        // Register the browser message listener via jslib.
//        // Start() fires before unity.html sends "UnityReady", so the listener
//        // is registered before the parent ever flushes its message queue.
//        InitJSBridge();
//#endif
//    }

//    // ---------------------------------------------------------------
//    // CONTEXT MENU TESTS (Editor only)
//    // ---------------------------------------------------------------
//    [ContextMenu("Test: Set Red (Slot 0)")]
//    public void TestRed() => SetMaterialColor("0|#FF0000");

//    [ContextMenu("Test: Rotation 45° (Slot 0)")]
//    public void TestRotation45() => SetRotation("0|45");

//    [ContextMenu("Test: Rotation 90° (Slot 0)")]
//    public void TestRotation90() => SetRotation("0|90");

//    [ContextMenu("Test: Reset Rotation (Slot 0)")]
//    public void TestRotationReset() => SetRotation("0|0");

//    [ContextMenu("Test: Restore Originals")]
//    public void ManualRestore() => RestoreOriginals();

//    [ContextMenu("Test: Deselect")]
//    public void TestDeselect() => DeselectCurrent();

//    // ---------------------------------------------------------------
//    // UPDATE — INPUT
//    // ---------------------------------------------------------------
//    void Update()
//    {
//        // Escape = deselect current object
//        if (Input.GetKeyDown(KeyCode.Escape))
//        {
//            DeselectCurrent();
//            return;
//        }

//        // Left-click = raycast select / deselect
//        if (Input.GetMouseButtonDown(0))
//        {
//            Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
//            if (Physics.Raycast(ray, out RaycastHit hit))
//                Select(hit.collider.gameObject);
//            else
//                DeselectCurrent(); // clicked into empty space
//        }
//    }

//    // ---------------------------------------------------------------
//    // SELECTION — injects outline material slot
//    // ---------------------------------------------------------------
//    public void Select(GameObject target)
//    {
//        if (target == _currentSelected) return;

//        DeselectCurrent();

//        _currentSelected = target;
//        Renderer[] rends = _currentSelected.GetComponentsInChildren<Renderer>();
//        if (rends.Length == 0) return;

//        foreach (var r in rends)
//        {
//            _originalMaterialCache[r] = r.sharedMaterials;
//            _selectedRenderers.Add(r);

//            Material[] newMats = new Material[r.sharedMaterials.Length + 1];
//            for (int i = 0; i < r.sharedMaterials.Length; i++)
//                newMats[i] = r.sharedMaterials[i];
//            newMats[newMats.Length - 1] = outlineMaterial;
//            r.sharedMaterials = newMats;
//        }

//#if UNITY_WEBGL && !UNITY_EDITOR
//        OnObjectSelected(_currentSelected.name, _originalMaterialCache[rends[0]].Length);
//#endif
//        OnSelectionChanged?.Invoke(true);   // notify WalkthroughCamera etc.
//    }

//    public void DeselectCurrent()
//    {
//        if (_currentSelected == null) return;

//        // Destroy any temporary PainterPro shader materials before restoring originals
//        DestroyCreatedMaterials();

//        foreach (var r in _selectedRenderers)
//        {
//            if (r != null && _originalMaterialCache.ContainsKey(r))
//                r.sharedMaterials = _originalMaterialCache[r];
//        }

//        _selectedRenderers.Clear();
//        _originalMaterialCache.Clear();
//        _currentSelected = null;

//#if UNITY_WEBGL && !UNITY_EDITOR
//        OnObjectSelected("", 0);
//#endif
//        OnSelectionChanged?.Invoke(false);
//    }

//    // ---------------------------------------------------------------
//    // RESTORE — clears property block overrides, keeps selection
//    // ---------------------------------------------------------------
//    public void RestoreOriginals()
//    {
//        // Swap any PainterPro shader instances back to the cached originals
//        foreach (var r in _selectedRenderers)
//        {
//            if (r == null || !_originalMaterialCache.ContainsKey(r)) continue;

//            Material[] current = r.sharedMaterials;
//            Material[] original = _originalMaterialCache[r];
//            bool changed = false;

//            for (int i = 0; i < original.Length && i < current.Length; i++)
//            {
//                if (_createdMaterials.Contains(current[i]))
//                {
//                    Destroy(current[i]);
//                    current[i] = original[i];
//                    changed = true;
//                }
//            }
//            if (changed) r.sharedMaterials = current;
//        }
//        _createdMaterials.Clear();

//        // Then clear all property block overrides
//        foreach (var r in _selectedRenderers)
//            if (r != null) ClearPropertyBlocks(r);
//    }

//    private void DestroyCreatedMaterials()
//    {
//        foreach (var mat in _createdMaterials)
//            if (mat != null) Destroy(mat);
//        _createdMaterials.Clear();
//    }

//    private void ClearPropertyBlocks(Renderer r)
//    {
//        if (!_originalMaterialCache.ContainsKey(r)) return;
//        int originalCount = _originalMaterialCache[r].Length;
//        for (int i = 0; i < originalCount; i++)
//            r.SetPropertyBlock(null, i);
//    }

//    // ---------------------------------------------------------------
//    // 4K SCREENSHOT — triggered by browser "Download 4K" button
//    // Payload: ignored (can be empty string)
//    // ---------------------------------------------------------------
//    public void CaptureScreenshot(string _)
//    {
//        StartCoroutine(Capture4K());
//    }

//    private IEnumerator Capture4K()
//    {
//        yield return new WaitForEndOfFrame();

//        // Render at 4× supersampling (≈3840×2160 at a 1920×1080 viewport)
//        int scale = 4;
//        int w = Screen.width * scale;
//        int h = Screen.height * scale;

//        RenderTexture rt = new RenderTexture(w, h, 24, RenderTextureFormat.ARGB32);
//        rt.antiAliasing = 4;

//        Camera cam = Camera.main;
//        cam.targetTexture = rt;
//        cam.Render();

//        RenderTexture.active = rt;
//        Texture2D tex = new Texture2D(w, h, TextureFormat.RGB24, false);
//        tex.ReadPixels(new Rect(0, 0, w, h), 0, 0);
//        tex.Apply();

//        cam.targetTexture = null;
//        RenderTexture.active = null;
//        Destroy(rt);

//        byte[] bytes = tex.EncodeToPNG();
//        Destroy(tex);

//#if UNITY_WEBGL && !UNITY_EDITOR
//        DownloadFile(bytes, bytes.Length, "PainterPro_4K.png");
//#else
//        System.IO.File.WriteAllBytes(
//            System.IO.Path.Combine(Application.persistentDataPath, "PainterPro_4K.png"), bytes);
//        Debug.Log("[ObjectSelector] 4K screenshot saved to: " + Application.persistentDataPath);
//#endif
//    }

//    // ---------------------------------------------------------------
//    // COLOR    payload: "slotIndex|#RRGGBB"
//    // ---------------------------------------------------------------
//    public void SetMaterialColor(string data)
//    {
//        if (_currentSelected == null) return;
//        string[] parts = data.Split('|');
//        int index = int.Parse(parts[0]);
//        string hex = parts[1];

//        if (ColorUtility.TryParseHtmlString(hex, out Color col))
//        {
//            foreach (var r in _selectedRenderers)
//            {
//                if (index >= r.sharedMaterials.Length) continue;
//                MaterialPropertyBlock block = new MaterialPropertyBlock();
//                r.GetPropertyBlock(block, index);
//                block.SetColor("baseColorFactor", col); // glTF Standard
//                block.SetColor("_BaseColor", col);       // URP Lit
//                r.SetPropertyBlock(block, index);
//            }
//        }
//    }

//    // ---------------------------------------------------------------
//    // TEXTURE    payload: "slotIndex|url"
//    // ---------------------------------------------------------------
//    public void SetMaterialTexture(string data)
//    {
//        if (_currentSelected == null) return;
//        string[] parts = data.Split('|');
//        int index = int.Parse(parts[0]);
//        string url = parts[1];
//        StartCoroutine(DownloadAndApplyTexture(url, index));
//    }

//    private IEnumerator DownloadAndApplyTexture(string url, int index)
//    {
//        using (UnityWebRequest uwr = UnityWebRequestTexture.GetTexture(url))
//        {
//            yield return uwr.SendWebRequest();
//            if (uwr.result == UnityWebRequest.Result.Success)
//            {
//                Texture2D tex = DownloadHandlerTexture.GetContent(uwr);
//                foreach (var r in _selectedRenderers)
//                {
//                    if (index >= r.sharedMaterials.Length) continue;
//                    MaterialPropertyBlock block = new MaterialPropertyBlock();
//                    r.GetPropertyBlock(block, index);
//                    block.SetTexture("baseColorTexture", tex);
//                    block.SetColor("baseColorFactor", Color.white);
//                    block.SetTexture("_BaseMap", tex);
//                    block.SetColor("_BaseColor", Color.white);
//                    r.SetPropertyBlock(block, index);
//                }
//            }
//            else
//            {
//                Debug.LogWarning("[ObjectSelector] Texture download failed: " + uwr.error);
//            }
//        }
//    }

//    // ---------------------------------------------------------------
//    // TILING    payload: "slotIndex|value"
//    // ---------------------------------------------------------------
//    public void SetTiling(string data)
//    {
//        if (_currentSelected == null) return;
//        string[] parts = data.Split('|');
//        int index = int.Parse(parts[0]);
//        float tiling = float.Parse(parts[1], CultureInfo.InvariantCulture);

//        foreach (var r in _selectedRenderers)
//        {
//            if (index >= r.sharedMaterials.Length) continue;
//            MaterialPropertyBlock block = new MaterialPropertyBlock();
//            r.GetPropertyBlock(block, index);
//            block.SetVector("_BaseMap_ST", new Vector4(tiling, tiling, 0f, 0f));
//            r.SetPropertyBlock(block, index);
//        }
//    }

//    // ---------------------------------------------------------------
//    // ROTATION    payload: "slotIndex|degrees"
//    // Automatically swaps material to PainterPro/RotatableLit if the
//    // current material's shader doesn't support _BaseMap_Rotation.
//    // ---------------------------------------------------------------
//    public void SetRotation(string data)
//    {
//        if (_currentSelected == null) return;
//        string[] parts = data.Split('|');
//        int index = int.Parse(parts[0]);
//        float degrees = float.Parse(parts[1], CultureInfo.InvariantCulture);
//        float radians = degrees * Mathf.Deg2Rad;

//        foreach (var r in _selectedRenderers)
//        {
//            if (index >= r.sharedMaterials.Length) continue;

//            // Ensure the material uses a shader that has _BaseMap_Rotation
//            EnsureRotatableShader(r, index);

//            MaterialPropertyBlock block = new MaterialPropertyBlock();
//            r.GetPropertyBlock(block, index);
//            block.SetFloat("_BaseMap_Rotation", radians);
//            r.SetPropertyBlock(block, index);
//        }
//    }

//    // ---------------------------------------------------------------
//    // SHADER SWAP HELPER
//    // Swaps a renderer's material slot to PainterPro/RotatableLit,
//    // copying _BaseMap, _BaseColor, _BaseMap_ST, _Metallic, _Smoothness
//    // from the original. No-op if the shader already supports rotation.
//    // ---------------------------------------------------------------
//    private void EnsureRotatableShader(Renderer r, int slot)
//    {
//        Material current = r.sharedMaterials[slot];
//        if (current == null || current.shader.name == RotatableShaderName) return;

//        Shader rotatable = Shader.Find(RotatableShaderName);
//        if (rotatable == null)
//        {
//            Debug.LogWarning("[ObjectSelector] Shader 'PainterPro/RotatableLit' not found. " +
//                             "Add PainterPro_RotatableLit.shader to your Assets/Shaders folder.");
//            return;
//        }

//        // Create a new material instance on our custom shader
//        Material upgraded = new Material(rotatable);
//        upgraded.name = current.name + "_Rotatable";

//        // ── URP Lit property names ──────────────────────────────────────────────
//        CopyPropertyIfExists(current, upgraded, "_BaseMap", (s, d) => d.SetTexture("_BaseMap", s.GetTexture("_BaseMap")));
//        CopyPropertyIfExists(current, upgraded, "_MainTex", (s, d) => d.SetTexture("_BaseMap", s.GetTexture("_MainTex")));   // legacy URP
//        CopyPropertyIfExists(current, upgraded, "_BaseColor", (s, d) => d.SetColor("_BaseColor", s.GetColor("_BaseColor")));
//        CopyPropertyIfExists(current, upgraded, "_Color", (s, d) => d.SetColor("_BaseColor", s.GetColor("_Color")));     // legacy
//        CopyPropertyIfExists(current, upgraded, "_BaseMap_ST", (s, d) => d.SetVector("_BaseMap_ST", s.GetVector("_BaseMap_ST")));
//        CopyPropertyIfExists(current, upgraded, "_Metallic", (s, d) => d.SetFloat("_Metallic", s.GetFloat("_Metallic")));
//        CopyPropertyIfExists(current, upgraded, "_Smoothness", (s, d) => d.SetFloat("_Smoothness", s.GetFloat("_Smoothness")));
//        CopyPropertyIfExists(current, upgraded, "_Roughness", (s, d) => d.SetFloat("_Smoothness", 1f - s.GetFloat("_Roughness")));

//        // ── glTF / GLTFast property names ──────────────────────────────────────
//        // GLTFast shaders use these instead of the URP _BaseMap / _BaseColor names.
//        // We map them to the equivalent properties our custom shader understands.
//        CopyPropertyIfExists(current, upgraded, "baseColorTexture", (s, d) => d.SetTexture("_BaseMap", s.GetTexture("baseColorTexture")));
//        CopyPropertyIfExists(current, upgraded, "baseColorFactor", (s, d) => d.SetColor("_BaseColor", s.GetColor("baseColorFactor")));
//        CopyPropertyIfExists(current, upgraded, "metallicFactor", (s, d) => d.SetFloat("_Metallic", s.GetFloat("metallicFactor")));
//        CopyPropertyIfExists(current, upgraded, "roughnessFactor", (s, d) => d.SetFloat("_Smoothness", 1f - s.GetFloat("roughnessFactor")));

//        // Track for cleanup
//        _createdMaterials.Add(upgraded);

//        // Swap into the renderer
//        Material[] mats = r.sharedMaterials;
//        mats[slot] = upgraded;
//        r.sharedMaterials = mats;
//    }

//    private static void CopyPropertyIfExists(Material src, Material dst,
//        string propName, System.Action<Material, Material> copyAction)
//    {
//        if (src.HasProperty(propName)) copyAction(src, dst);
//    }

//    // ---------------------------------------------------------------
//    // ROUGHNESS    payload: "slotIndex|0..1"
//    // URP: Smoothness = 1 - Roughness
//    // ---------------------------------------------------------------
//    public void SetRoughness(string data)
//    {
//        if (_currentSelected == null) return;
//        string[] parts = data.Split('|');
//        int index = int.Parse(parts[0]);
//        float roughness = float.Parse(parts[1], CultureInfo.InvariantCulture);

//        foreach (var r in _selectedRenderers)
//        {
//            if (index >= r.sharedMaterials.Length) continue;
//            MaterialPropertyBlock block = new MaterialPropertyBlock();
//            r.GetPropertyBlock(block, index);
//            block.SetFloat("_Smoothness", 1f - roughness);
//            r.SetPropertyBlock(block, index);
//        }
//    }

//    // ---------------------------------------------------------------
//    // METALLIC    payload: "slotIndex|0..1"
//    // ---------------------------------------------------------------
//    public void SetMetallic(string data)
//    {
//        if (_currentSelected == null) return;
//        string[] parts = data.Split('|');
//        int index = int.Parse(parts[0]);
//        float metallic = float.Parse(parts[1], CultureInfo.InvariantCulture);

//        foreach (var r in _selectedRenderers)
//        {
//            if (index >= r.sharedMaterials.Length) continue;
//            MaterialPropertyBlock block = new MaterialPropertyBlock();
//            r.GetPropertyBlock(block, index);
//            block.SetFloat("_Metallic", metallic);
//            r.SetPropertyBlock(block, index);
//        }
//    }
//}
#endregion
