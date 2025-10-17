// input要素と表示用の要素を取得
const folderInput = document.getElementById("folderInput");
const output = document.getElementById("output");
const dropArea = document.getElementById("dropArea");




// ドラッグ＆ドロップ欄をクリック
dropArea.addEventListener("click", () => {
  folderInput.click(); // inputを擬似クリック
});

// -------------------
// フォルダ選択（クリック）
// -------------------
folderInput.addEventListener("change", (e) => {
  const files = e.target.files;
  console.log(files);
  graphConfig(files);
});



const graphConfig = (files) => {
  const tree = {};

  for (const file of files) {
    const parts = file.webkitRelativePath.split("/");
    
    let current = tree;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        current[part] = true;
      } else {
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    });
  }

  const printTree = (obj, prefix = "") => {
    let result = "";
    
    for (const key in obj) {
      if (obj[key] === true) {
        result += prefix + "├── " + key + "\n";
      } else {
        result += prefix + "├── " + key + "/📂" + "\n";
        result += printTree(obj[key], prefix + "│   ");
      }
    }
    return result;
  };

  output.textContent = printTree(tree);
};





// -------------------
// ドラッグ＆ドロップ対応
// -------------------
 // デフォルト動作を無効化（ファイルがブラウザで開かれないようにする）
dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropArea.style.borderColor = "#333";
  dropArea.style.color = "#333";
});

dropArea.addEventListener("dragleave", () => {
  dropArea.style.borderColor = "#ccc";
  dropArea.style.color = "#666";
});

dropArea.addEventListener("drop", async (e) => {
  e.preventDefault();
  dropArea.style.borderColor = "#ccc";
  dropArea.style.color = "#666";
  output.textContent = "読み込み中...";

  const items = e.dataTransfer.items;
  const files = [];
  console.log(items);
  
  // 再帰的にフォルダ内ファイルを取得
  const traverseFileTree = (item, path = "") => {
    return new Promise((resolve) => {
      if (item.isFile) {
        item.file(file => {
          // 既存関数用にパスをセット
          Object.defineProperty(file, "webkitRelativePath", {
            value: path + file.name,
            configurable: true
          });
          files.push(file);
          resolve();
        });
      } else if (item.isDirectory) {
        const dirReader = item.createReader();
        console.log(dirReader);
        dirReader.readEntries(entries => {
          Promise.all(entries.map(entry => traverseFileTree(entry, path + item.name + "/"))).then(() => resolve());
        });
      } else {
        resolve();
      }
    });
  };

  const promises = [];
  console.log(promises)
  // フォルダが複数選択される可能性を考慮してforでループ
  for (let i = 0; i < items.length; i++) {
    // wbkitgetasentry()でフォルダかファイル化を判別してitemに代入
    const item = items[i].webkitGetAsEntry();

    if (item) promises.push(traverseFileTree(item));
  }

  await Promise.all(promises);

    // Array -> FileList に変換
  // const dataTransfer = new DataTransfer();
  // files.forEach(file => dataTransfer.items.add(file));
  // const fileList = dataTransfer.files;
   // ここが input.files と同じ形式
  graphConfig(files);
});

    

// -------------------
// ツリー作成関数（既存コード）
// -------------------


// -------------------
// コピー機能（既存コード）
// -------------------
const copy = document.getElementById('copy-config');

copy.addEventListener('click', () => {
  if (output.textContent.trim() === "") {
    alert('フォルダを選択してください');
    return;
  }
  navigator.clipboard.writeText(output.textContent).then(
    () => { alert('コピー成功'); },
    () => { alert('コピー失敗'); }
  );
});


