window.ImmuneRushData=(()=>{'use strict';

const icons={
 shield:'<svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6z"/><path d="M8 12h8M12 8v8"/></svg>',
 cell:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></svg>',
 syringe:'<svg viewBox="0 0 24 24"><path d="M14 4l6 6M17 1l6 6M5 13l6 6M13 5L4 14l6 6 9-9z"/><path d="M4 20l-3 3M7 17l-4 4"/></svg>',
 antibody:'<svg viewBox="0 0 24 24"><path d="M12 21V11M12 11L6 5M12 11l6-6M4 3l4 4M20 3l-4 4"/></svg>',
 blood:'<svg viewBox="0 0 24 24"><path d="M12 2s7 8 7 13a7 7 0 1 1-14 0c0-5 7-13 7-13z"/><path d="M9 16c.5 1.4 1.5 2 3 2"/></svg>',
 cascade:'<svg viewBox="0 0 24 24"><circle cx="5" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="19" r="2"/><path d="M6.5 6.5l4 4M13.5 13.5l4 4M12 4v4M4 12h4M16 12h4"/></svg>',
 mhc:'<svg viewBox="0 0 24 24"><path d="M4 7h6l2 3 2-3h6M4 17h6l2-3 2 3h6"/><circle cx="12" cy="12" r="2"/></svg>'
};
const stages=[
 {id:'defense',title:'防線啟動',sub:'三道防線・吞噬・發炎・發燒',icon:'shield',tags:['先天免疫','三道防線'],brief:'病原突破皮膚屏障，請在後天免疫完成動員前守住第一線。',tasks:[
  {type:'choice',tag:'快速判斷',prompt:'完整皮膚、黏膜與正常菌叢屬於哪一道防線？',options:['第一道防線','第二道防線','第三道防線','免疫記憶'],answer:0,hint:'先想「阻止病原進入」的外部屏障。',explain:'皮膚、黏膜、纖毛、胃酸與正常菌叢屬第一道物理與化學屏障。',point:'三道防線'},
  {type:'rapid',tag:'分類突擊',prompt:'判斷下列項目屬於先天免疫或後天免疫。',categories:['先天免疫','後天免疫'],items:[['嗜中性球吞噬','先天免疫'],['記憶 B 細胞','後天免疫'],['發炎反應','先天免疫'],['專一性抗體','後天免疫'],['NK 細胞早期毒殺','先天免疫']],hint:'先天：快、非專一；後天：專一、有記憶。',explain:'先天免疫提供快速非專一反應；後天免疫由 B、T 細胞建立專一性與記憶。',point:'先天與後天免疫'},
  {type:'sequence',tag:'機轉排序',prompt:'請依吞噬作用的課程順序排列。',items:['攝入','趨化','毒殺','調理'],answer:['趨化','調理','攝入','毒殺'],hint:'先被吸引到現場，再讓病原更好被黏住。',explain:'吞噬作用可整理為趨化 → 調理 → 攝入 → 毒殺。',point:'吞噬四步驟'},
  {type:'choice',tag:'臨床線索',case:'手術傷口出現紅、腫、熱、痛。',prompt:'最直接相關的機轉是？',options:['肥大細胞介質造成血管變化','記憶 B 細胞大量增生','胸腺選擇作用','IgG 通過胎盤'],answer:0,hint:'紅、腫、熱、痛是局部發炎的經典表現。',explain:'肥大細胞釋放組織胺、前列腺素與白三烯，造成血管擴張與通透性增加。',point:'發炎反應'},
  {type:'boss',tag:'小型危機',case:'病人感染後體溫升高、畏寒，免疫細胞釋放 IL-1 等致熱性細胞激素。',prompt:'下一個關鍵作用位置是？',options:['下視丘體溫中樞','骨髓紅髓','胸腺皮質','腎小球'],answer:0,hint:'發燒的設定點由中樞調節。',explain:'致熱性細胞激素作用於下視丘並促進 PGE₂，調高體溫設定點。',point:'發燒機轉'}]},
 {id:'cells',title:'免疫部隊',sub:'巨噬細胞・B/T/NK・淋巴器官',icon:'cell',tags:['免疫細胞','淋巴器官'],brief:'免疫城市需要正確派兵。辨識每種細胞與器官的任務，避免指揮鏈崩潰。',tasks:[
  {type:'rapid',tag:'角色配對',prompt:'將免疫角色配對到最主要功能。',categories:['吞噬／呈現','製造抗體','協調免疫','早期毒殺'],items:[['巨噬細胞','吞噬／呈現'],['漿細胞','製造抗體'],['CD4 T 細胞','協調免疫'],['NK 細胞','早期毒殺']],hint:'B 細胞活化後的效應細胞才是抗體工廠。',explain:'巨噬細胞吞噬並呈現抗原；漿細胞分泌抗體；CD4 協調；NK 非專一早期毒殺。',point:'免疫細胞分工'},
  {type:'choice',tag:'器官定位',prompt:'T 細胞主要在哪個器官成熟並接受「再教育」？',options:['胸腺','脾臟','淋巴結','肝臟'],answer:0,hint:'T 代表 Thymus。',explain:'T 細胞在胸腺分化成熟；B 細胞在骨髓及周邊淋巴器官成熟。',point:'中央淋巴器官'},
  {type:'rapid',tag:'器官分類',prompt:'將淋巴器官分成中央與周邊。',categories:['中央淋巴器官','周邊淋巴器官'],items:[['骨髓','中央淋巴器官'],['胸腺','中央淋巴器官'],['淋巴結','周邊淋巴器官'],['脾臟','周邊淋巴器官'],['黏膜相關淋巴組織','周邊淋巴器官']],hint:'中央負責成熟；周邊負責遇見抗原與啟動反應。',explain:'中央淋巴器官為骨髓、胸腺；周邊包括淋巴結、脾臟與黏膜相關淋巴組織。',point:'淋巴組織'},
  {type:'choice',tag:'病毒警報',case:'病毒感染細胞降低 MHC class I 表現。',prompt:'哪一類細胞較可能因此解除抑制並進行毒殺？',options:['NK 細胞','紅血球','漿細胞','嗜鹼性球'],answer:0,hint:'正常 MHC I 對 NK 像「自己人識別證」。',explain:'當 MHC I 降低時，NK 細胞較缺乏抑制訊號，容易啟動胞殺。',point:'NK 細胞'},
  {type:'boss',tag:'臨床危機',case:'HIV 病人 CD4 T 細胞顯著下降。',prompt:'最可能造成的核心後果是？',options:['免疫協調能力下降，容易伺機性感染','抗體會立刻全部消失','紅血球無法攜氧','補體一定完全失活'],answer:0,hint:'CD4 是免疫反應的重要協調者。',explain:'CD4 T 細胞下降會破壞免疫指揮鏈，影響 B 細胞、巨噬細胞及其他 T 細胞反應。',point:'CD4 T 細胞'}]},
 {id:'immunity',title:'免疫記憶',sub:'主動／被動・天然／人工・疫苗',icon:'syringe',tags:['疫苗','免疫分類'],brief:'暴露後需要立即保護，還是建立長期記憶？請在時間壓力下選對免疫策略。',tasks:[
  {type:'rapid',tag:'四象限分類',prompt:'將情境分類到正確免疫類型。',categories:['主動天然','主動人工','被動天然','被動人工'],items:[['感染康復後形成記憶','主動天然'],['接種疫苗','主動人工'],['胎盤 IgG','被動天然'],['初乳 IgA','被動天然'],['注射免疫球蛋白','被動人工']],hint:'主動＝自己產生；被動＝直接取得。天然／人工看獲得方式。',explain:'疫苗屬主動人工；胎盤 IgG、初乳 IgA 屬被動天然；免疫球蛋白屬被動人工。',point:'免疫分類'},
  {type:'choice',tag:'時間判讀',prompt:'哪一種免疫通常生效快速，但維持時間較短且不形成記憶？',options:['被動免疫','主動免疫','第三道防線全部','細胞性免疫全部'],answer:0,hint:'現成抗體能立即使用，但身體沒有自己練兵。',explain:'被動免疫直接提供抗體，生效快但通常維持短、無免疫記憶。',point:'主動與被動'},
  {type:'choice',tag:'母胎免疫',prompt:'唯一能通過胎盤、提供胎兒被動天然免疫的主要抗體是？',options:['IgG','IgM','IgA','IgE'],answer:0,hint:'也是血中含量最多的免疫球蛋白。',explain:'IgG 可通過胎盤；IgA 主要透過初乳與黏膜分泌液保護。',point:'胎盤 IgG'},
  {type:'choice',tag:'暴露後處置',case:'未具免疫力者暴露 B 型肝炎病毒，需要立即提供保護。',prompt:'最符合「立即、短期」的措施是？',options:['注射專一性免疫球蛋白','等待自然感染形成記憶','只給一般維生素','立即移除胸腺'],answer:0,hint:'題幹出現「暴露後、立即」。',explain:'被動人工免疫可藉專一性免疫球蛋白立即提供抗體。',point:'被動人工免疫'},
  {type:'boss',tag:'策略決策',case:'免疫功能低下病人準備接種疫苗。',prompt:'判斷疫苗安全時，最應優先注意哪個概念？',options:['減毒活疫苗可能需特別評估','所有疫苗都一定相同','IgM 一定能通過胎盤','疫苗就是現成抗體'],answer:0,hint:'活疫苗仍保留複製能力。',explain:'減毒活疫苗免疫原性較強，但免疫功能不良者需依情況審慎評估。',point:'疫苗安全'}]},
 {id:'antibody',title:'抗體鍛造',sub:'抗原・表位・半抗原・五大 Ig',icon:'antibody',tags:['抗原抗體','免疫球蛋白'],brief:'抗原情報混雜。請辨識表位、半抗原與抗體結構，完成五大 Ig 裝備配置。',tasks:[
  {type:'rapid',tag:'概念辨識',prompt:'將概念配對到正確定義。',categories:['免疫原','半抗原','表位','抗體'],items:[['可誘發免疫反應的分子','免疫原'],['單獨無法誘發完整反應的小分子','半抗原'],['免疫系統實際辨識的局部區域','表位'],['由漿細胞分泌的免疫球蛋白','抗體']],hint:'表位是抗原上的「被辨識局部」。',explain:'免疫原能誘發反應；半抗原需結合載體；表位是辨識位置；抗體由漿細胞產生。',point:'抗原基本概念'},
  {type:'rapid',tag:'Ig 快速配對',prompt:'把關鍵字配到正確免疫球蛋白。',categories:['IgG','IgM','IgA','IgE','IgD'],items:[['胎盤與二次反應','IgG'],['初次感染最早出現','IgM'],['初乳與黏膜分泌液','IgA'],['過敏與寄生蟲','IgE'],['B 細胞表面受體之一','IgD']],hint:'G 胎盤、M 初期、A 黏膜、E 過敏、D B 細胞表面。',explain:'五大 Ig 的核心臨床關鍵字可快速完成判讀。',point:'五大免疫球蛋白'},
  {type:'choice',tag:'結構判讀',prompt:'抗體的哪一區共同決定抗原辨識專一性？',options:['重鏈與輕鏈的可變區','所有固定區完全相同','只有 J 鏈','紅血球膜'],answer:0,hint:'V 代表 variable。',explain:'重鏈與輕鏈的可變區共同形成 Fab 抗原結合部位。',point:'抗體結構'},
  {type:'choice',tag:'抗體效應',prompt:'抗體包覆病原，使吞噬細胞更容易清除，稱為？',options:['調理作用','耐受作用','熱失活','負選擇'],answer:0,hint:'像在病原表面貼上「請吞我」標籤。',explain:'調理作用可由抗體或 C3b 包覆病原，提升吞噬效率。',point:'抗體功能'},
  {type:'boss',tag:'檢驗判讀',case:'病人症狀出現後 IgM 先升高，後續 IgG 增加。',prompt:'最合理的解讀是？',options:['免疫反應由初期走向較成熟階段','一定代表沒有感染','IgM 已通過胎盤','IgG 只存在黏膜'],answer:0,hint:'M 常先，G 常後且二次反應更明顯。',explain:'IgM 常見於初期反應，之後 IgG 增加；實際仍需結合檢驗方法與臨床時序。',point:'IgM／IgG 時序'}]},
 {id:'blood',title:'血型危機',sub:'ABO・Rh・交叉試驗・溶血',icon:'blood',tags:['輸血安全','母胎免疫'],brief:'血庫發出緊急警報。請辨識紅血球抗原與血漿抗體，阻止溶血反應。',tasks:[
  {type:'rapid',tag:'ABO 配對',prompt:'判斷血型的紅血球表面抗原。',categories:['有 A 抗原','有 B 抗原','有 A 與 B 抗原','無 A/B 抗原'],items:[['A 型','有 A 抗原'],['B 型','有 B 抗原'],['AB 型','有 A 與 B 抗原'],['O 型','無 A/B 抗原']],hint:'血型名稱通常對應紅血球表面抗原。',explain:'A 型有 A 抗原；B 型有 B 抗原；AB 兩者皆有；O 兩者皆無。',point:'ABO 抗原'},
  {type:'choice',tag:'血漿抗體',prompt:'A 型血的血漿中主要具有哪一種 ABO 抗體？',options:['抗 B 抗體','抗 A 抗體','完全沒有抗體','只有抗 Rh 抗體'],answer:0,hint:'不會攻擊自己的 A 抗原。',explain:'A 型紅血球有 A 抗原，血漿中具有抗 B 抗體。',point:'ABO 抗體'},
  {type:'choice',tag:'交叉試驗',prompt:'輸血前進行交叉試驗的主要目的為何？',options:['降低抗原抗體不相容造成溶血的風險','讓 IgE 增加','使補體永久失活','促進胸腺生長'],answer:0,hint:'輸血安全的核心是避免不相容反應。',explain:'交叉試驗用於確認受血者與捐血者血液相容性，避免凝集與溶血。',point:'交叉試驗'},
  {type:'choice',tag:'Rh 母胎',case:'Rh 陰性母親曾懷有 Rh 陽性胎兒。',prompt:'後續懷孕風險主要與哪一類抗體可通過胎盤有關？',options:['IgG 抗 Rh 抗體','IgM 抗 ABO 抗體','IgA 分泌型抗體','IgE 反應素'],answer:0,hint:'Rh 抗體較小，能通過胎盤。',explain:'Rh 抗體主要屬 IgG，可通過胎盤並造成新生兒溶血風險。',point:'Rh 與 IgG'},
  {type:'boss',tag:'臨床危機',case:'輸血開始 10 分鐘後，病人出現畏寒、胸悶、腰背痛與低血壓。',prompt:'最優先的處置是？',options:['立即停止輸血並維持靜脈通路','加快輸血速度','先觀察 30 分鐘再處理','拔除所有靜脈管路'],answer:0,hint:'疑似輸血反應先阻止更多血液進入。',explain:'疑似急性輸血反應應立即停止輸血、維持通路，並依流程通知、核對與送檢。',point:'輸血反應'}]},
 {id:'complement',title:'補體連鎖',sub:'三大路徑・C3/C5・調理・MAC',icon:'cascade',tags:['補體','連鎖反應'],brief:'補體反應失控。請正確啟動三條路徑，將連鎖反應導向 C3、C5 與 MAC。',tasks:[
  {type:'rapid',tag:'路徑辨識',prompt:'將啟動方式配對到補體路徑。',categories:['古典途徑','凝集素途徑','替代途徑'],items:[['抗原抗體複合物','古典途徑'],['MBL 辨識病原甘露糖','凝集素途徑'],['C3 自發性水解','替代途徑']],hint:'古典需要抗體；凝集素看糖；替代可由 C3 自發啟動。',explain:'三條路徑的起點不同，但後續皆匯聚至 C3/C5 轉化酶。',point:'補體三路徑'},
  {type:'sequence',tag:'連鎖排序',prompt:'請排列古典途徑的主要反應方向。',items:['C5 轉化酶','抗原抗體複合物','MAC','C3 轉化酶'],answer:['抗原抗體複合物','C3 轉化酶','C5 轉化酶','MAC'],hint:'先有抗原抗體複合物，再逐步放大。',explain:'古典途徑由抗原抗體複合物啟動，形成 C3 轉化酶、C5 轉化酶，最後形成 MAC。',point:'補體連鎖'},
  {type:'rapid',tag:'分子配對',prompt:'將補體分子配到主要作用。',categories:['調理作用','發炎／趨化','膜攻擊裂解'],items:[['C3b','調理作用'],['C3a','發炎／趨化'],['C5a','發炎／趨化'],['C5b-9','膜攻擊裂解']],hint:'b 常想到 binding/opsonization；C5b-9 是 MAC。',explain:'C3b 調理；C3a、C5a 為發炎與趨化片段；C5b-9 形成膜攻擊複合體。',point:'補體效應'},
  {type:'choice',tag:'實驗陷阱',prompt:'血清經 56°C 加熱 30 分鐘後，最可能發生什麼變化？',options:['補體失去活性','IgG 一定全部消失','紅血球產生細胞核','B 細胞轉成 T 細胞'],answer:0,hint:'補體不耐熱。',explain:'補體不耐熱，56°C、30 分鐘可使其失活。',point:'補體特性'},
  {type:'boss',tag:'系統危機',case:'病原表面已被 C3b 包覆，且 C5a 在感染部位升高。',prompt:'最符合的後續效應是？',options:['促進吞噬並招募白血球','抑制所有發炎反應','阻止吞噬細胞到場','只形成免疫記憶'],answer:0,hint:'C3b 是調理，C5a 是強力趨化。',explain:'C3b 促進調理吞噬，C5a 促進發炎與白血球趨化。',point:'補體整合效應'}]},
 {id:'mhc',title:'MHC 最終戰',sub:'體液性／細胞性・MHC I/II・CD4/CD8',icon:'mhc',tags:['MHC','最終 Boss'],boss:true,brief:'病毒與外源性病原同時入侵。只有正確分配 MHC、T 細胞與 B 細胞，才能完成最終清除。',tasks:[
  {type:'rapid',tag:'MHC 分流',prompt:'將描述分到 MHC class I 或 II。',categories:['MHC class I','MHC class II'],items:[['幾乎所有有核細胞表現','MHC class I'],['主要呈現給 CD8 T 細胞','MHC class I'],['專業 APC 表現','MHC class II'],['主要呈現給 CD4 T 細胞','MHC class II'],['外源性抗原路徑','MHC class II'],['內源性抗原路徑','MHC class I']],hint:'I → CD8；II → CD4。',explain:'MHC I 呈現內源性抗原給 CD8；MHC II 由專業 APC 呈現外源性抗原給 CD4。',point:'MHC I／II'},
  {type:'sequence',tag:'體液性流程',prompt:'請排列體液性免疫活化流程。',items:['B 細胞活化','MHC II 呈現','漿細胞分泌抗體','CD4 T 細胞活化'],answer:['MHC II 呈現','CD4 T 細胞活化','B 細胞活化','漿細胞分泌抗體'],hint:'APC 先報告，CD4 再協助 B 細胞。',explain:'外源性抗原由 MHC II 呈現，活化 CD4，再協助 B 細胞成為漿細胞並產生抗體。',point:'體液性免疫'},
  {type:'sequence',tag:'細胞性流程',prompt:'請排列病毒感染細胞的毒殺流程。',items:['CD8 T 細胞辨識','標的細胞凋亡','MHC I 呈現內源性抗原','穿孔素／顆粒酶作用'],answer:['MHC I 呈現內源性抗原','CD8 T 細胞辨識','穿孔素／顆粒酶作用','標的細胞凋亡'],hint:'感染細胞先把內部抗原放到 MHC I。',explain:'MHC I 呈現內源性抗原後，由 CD8 T 細胞辨識並透過穿孔素、顆粒酶促進凋亡。',point:'細胞性免疫'},
  {type:'choice',tag:'功能比較',prompt:'下列哪一項最符合體液性免疫？',options:['B 細胞與抗體清除體液中的病原與毒素','CD8 直接毒殺病毒感染細胞','NK 監視 MHC I 降低細胞','胸腺淘汰自體反應 T 細胞'],answer:0,hint:'體液性免疫的武器存在於體液中。',explain:'體液性免疫以 B 細胞、漿細胞與抗體為主，進行中和、調理與補體活化。',point:'體液性免疫'},
  {type:'boss',tag:'FINAL BOSS',case:'樹突細胞吞噬細菌並將外源性抗原呈現；同時另一個細胞遭病毒感染。',prompt:'哪一組配對最正確？',options:['樹突細胞：MHC II→CD4；病毒感染細胞：MHC I→CD8','樹突細胞：MHC I→CD4；病毒感染細胞：MHC II→CD8','兩者都只用 MHC III','兩者都只能活化 B 細胞'],answer:0,hint:'外源性與內源性是關鍵字。',explain:'外源性抗原由專業 APC 透過 MHC II 呈現給 CD4；病毒內源性抗原由 MHC I 呈現給 CD8。',point:'MHC 臨床整合'}]}
];

return {icons,stages};
})();
