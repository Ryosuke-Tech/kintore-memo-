'use strict';

/* ===== 定数 ===== */
const STORAGE_KEY = 'kintore-memo-v1';
const PARTS = ['胸', '背中', '脚', '肩', '腕', '腹'];
const PART_ICONS = { 胸: '🦍', 背中: '🐢', 脚: '🦵', 肩: '🏔️', 腕: '💪', 腹: '🍫' };
const partLabel = (p) => (PART_ICONS[p] ? `${PART_ICONS[p]} ${p}` : p);
const MAX_BODY_PER_DAY = 4;
const DECIMAL1 = /^\d+(\.\d)?$/; // 小数第1桁まで(文字列で判定し、浮動小数点を避ける)
const INTEGER = /^\d+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// 運動強度(METs)。Compendium of Physical Activities (2011) の値
// 日本食品標準成分表(八訂)増補2023年(文部科学省 食品成分データベース)で確認した値。可食部100gあたり
const PRESET_FOODS = [
  { id: 'preset:01088', no: '01088', name: 'ご飯(精白米・うるち米、炊いた後)', basis: 'g100', kcal: 156, p: 2.5, f: 0.3, c: 37.1 },
  { id: 'preset:01083', no: '01083', name: '精白米(うるち米、炊く前)', basis: 'g100', kcal: 342, p: 6.1, f: 0.9, c: 77.6 },
  { id: 'preset:11220', no: '11220', name: '鶏むね肉(若どり・皮なし・生)', basis: 'g100', kcal: 105, p: 23.3, f: 1.9, c: 0.1 },
  { id: 'preset:11227', no: '11227', name: '鶏ささみ(若どり・生)', basis: 'g100', kcal: 98, p: 23.9, f: 0.8, c: 0.1 },
  { id: 'preset:12004', no: '12004', name: '鶏卵(全卵・生)', basis: 'g100', kcal: 142, p: 12.2, f: 10.2, c: 0.4 },
  { id: 'preset:13003', no: '13003', name: '普通牛乳', basis: 'g100', kcal: 61, p: 3.3, f: 3.8, c: 4.8 },
  { id: 'preset:04046', no: '04046', name: '糸引き納豆', basis: 'g100', kcal: 184, p: 16.5, f: 10.0, c: 12.1 },
  { id: 'preset:01026', no: '01026', name: '食パン(角形食パン)', basis: 'g100', kcal: 248, p: 8.9, f: 4.1, c: 46.4 },
  { id: 'preset:04032', no: '04032', name: '木綿豆腐', basis: 'g100', kcal: 73, p: 7.0, f: 4.9, c: 1.5 },
  { id: 'preset:07107', no: '07107', name: 'バナナ(生・皮を除く)', basis: 'g100', kcal: 93, p: 1.1, f: 0.2, c: 22.5 },
  { id: 'preset:10134', no: '10134', name: 'しろさけ(鮭・生)', basis: 'g100', kcal: 124, p: 22.3, f: 4.1, c: 0.1 },
  { id: 'preset:11230', no: '11230', name: '鶏ひき肉(生)', basis: 'g100', kcal: 171, p: 17.5, f: 12.0, c: 0.0 },
  { id: 'preset:11183', no: '11183', name: 'ばらベーコン', basis: 'g100', kcal: 241, p: 15.4, f: 19.4, c: 3.2 },
];

// 食べスコ(日本食品標準成分表2020年版(八訂)準拠)の値。可食部100gあたり。
// 2023年増補で改訂された食品は、公式の最新値と少し違うことがある
const EXTRA_SRC = '食べスコ(日本食品標準成分表2020年版(八訂)準拠。2023年の更新で、公式の値と違う場合があります)';
const EXTRA_ROWS = [
  ['ご飯・パン・めん', '01004', 'オートミール', 350, 13.7, 5.7, 69.1],
  ['ご飯・パン・めん', '01085', 'ご飯(玄米)', 152, 2.8, 1.0, 35.6],
  ['ご飯・パン・めん', '01111', 'おにぎり', 170, 2.7, 0.3, 39.4],
  ['ご飯・パン・めん', '01117', 'もち', 223, 4.0, 0.6, 50.8],
  ['ご飯・パン・めん', '01174', '食パン(焼き)', 269, 9.7, 4.5, 50.6],
  ['ご飯・パン・めん', '01034', 'ロールパン', 309, 10.1, 9.0, 48.6],
  ['ご飯・パン・めん', '01148', 'ベーグル', 270, 9.6, 2.0, 54.6],
  ['ご飯・パン・めん', '01039', 'うどん(ゆで)', 95, 2.6, 0.4, 21.6],
  ['ご飯・パン・めん', '01128', 'そば(ゆで)', 130, 4.8, 1.0, 26.0],
  ['ご飯・パン・めん', '01064', 'スパゲッティ(ゆで)', 150, 5.8, 0.9, 32.2],
  ['ご飯・パン・めん', '01063', 'スパゲッティ(乾)', 347, 12.9, 1.8, 73.1],
  ['ご飯・パン・めん', '01044', 'そうめん・ひやむぎ(ゆで)', 114, 3.5, 0.4, 25.8],
  ['ご飯・パン・めん', '01048', '中華めん(ゆで)', 133, 4.9, 0.6, 29.2],
  ['ご飯・パン・めん', '01137', 'コーンフレーク', 380, 7.8, 1.7, 83.6],
  ['肉類', '11219', '鶏むね肉(若どり・皮つき・生)', 133, 21.3, 5.9, 0.1],
  ['肉類', '11288', '鶏むね肉(若どり・皮なし・焼き)', 177, 38.8, 3.3, 0.1],
  ['肉類', '11224', '鶏もも肉(若どり・皮なし・生)', 113, 19.0, 5.0, 0.0],
  ['肉類', '11225', '鶏もも肉(若どり・皮なし・焼き)', 145, 25.5, 5.7, 0.0],
  ['肉類', '11221', '鶏もも肉(若どり・皮つき・生)', 190, 16.6, 14.2, 0.0],
  ['肉類', '11289', '鶏もも肉(若どり・皮つき・から揚げ)', 307, 24.2, 18.1, 13.3],
  ['肉類', '11229', '鶏ささみ(若どり・ゆで)', 121, 29.6, 1.0, 0.0],
  ['肉類', '11228', '鶏ささみ(若どり・焼き)', 132, 31.7, 1.4, 0.0],
  ['肉類', '11292', 'チキンナゲット', 235, 15.5, 13.7, 14.9],
  ['肉類', '11140', '豚ヒレ肉(大型種・赤肉・生)', 118, 22.2, 3.7, 0.3],
  ['肉類', '11131', '豚もも肉(大型種・皮下脂肪なし・生)', 138, 21.5, 6.0, 0.2],
  ['肉類', '11123', '豚ロース(大型種・脂身つき・生)', 248, 19.3, 19.2, 0.2],
  ['肉類', '11119', '豚かたロース(大型種・脂身つき・生)', 237, 17.1, 19.2, 0.1],
  ['肉類', '11129', '豚ばら肉(大型種・脂身つき・生)', 366, 14.4, 35.4, 0.1],
  ['肉類', '11163', '豚ひき肉(生)', 209, 17.7, 17.2, 0.1],
  ['肉類', '11048', '牛もも肉(乳用肥育牛・皮下脂肪なし・生)', 169, 20.5, 9.9, 0.4],
  ['肉類', '11059', '牛ヒレ肉(乳用肥育牛・赤肉・生)', 177, 20.8, 11.2, 0.5],
  ['肉類', '11034', '牛かたロース(乳用肥育牛・脂身つき・生)', 295, 16.2, 26.4, 0.2],
  ['肉類', '11046', '牛ばら肉(乳用肥育牛・脂身つき・生)', 381, 12.8, 39.4, 0.3],
  ['肉類', '11076', '牛もも肉(輸入牛・皮下脂肪なし・生)', 133, 20.0, 6.7, 0.4],
  ['肉類', '11089', '牛ひき肉(生)', 251, 17.1, 21.1, 0.3],
  ['肉類', '11176', 'ロースハム', 211, 18.6, 14.5, 2.0],
  ['肉類', '11186', 'ウインナーソーセージ', 319, 11.5, 30.6, 3.3],
  ['肉類', '11107', 'ビーフジャーキー', 304, 54.8, 7.8, 6.4],
  ['魚・卵・乳・大豆', '10253', 'くろまぐろ(天然・赤身・生)', 115, 26.4, 1.4, 0.1],
  ['魚・卵・乳・大豆', '12005', '鶏卵(全卵・ゆで)', 134, 12.5, 10.4, 0.3],
  ['魚・卵・乳・大豆', '13025', 'ヨーグルト(全脂無糖)', 56, 3.6, 3.0, 4.9],
  ['魚・卵・乳・大豆', '04033', '絹ごし豆腐', 56, 5.3, 3.5, 2.0],
  ['野菜・果物・その他', '06263', 'ブロッコリー(花序・生)', 37, 5.4, 0.6, 6.6],
  ['野菜・果物・その他', '06153', 'たまねぎ(生)', 33, 1.0, 0.1, 8.4],
  ['野菜・果物・その他', '06182', 'トマト(赤色・生)', 20, 0.7, 0.1, 4.7],
  ['野菜・果物・その他', '06084', 'ごぼう(生)', 58, 1.8, 0.1, 15.4],
  ['野菜・果物・その他', '08001', 'えのきたけ(生)', 34, 2.7, 0.2, 7.6],
  ['野菜・果物・その他', '07176', 'りんご(皮つき・生)', 56, 0.2, 0.3, 16.2],
  ['野菜・果物・その他', '07148', 'りんご(皮なし・生)', 53, 0.1, 0.2, 15.5],
  ['野菜・果物・その他', '07040', 'オレンジ(ネーブル・生)', 48, 0.9, 0.1, 11.8],
  ['野菜・果物・その他', '05014', 'くるみ(いり)', 713, 14.6, 68.8, 11.7],
  ['野菜・果物・その他', '17046', '米みそ(赤色辛みそ)', 178, 13.1, 5.5, 21.1],
  ['おかず・惣菜', '18036', '肉じゃが', 78, 4.3, 1.3, 13.0],
  ['おかず・惣菜', '18035', '筑前煮', 85, 4.4, 3.5, 10.2],
  ['おかず・惣菜', '18033', 'きんぴらごぼう', 84, 1.4, 4.5, 11.3],
  ['おかず・惣菜', '18030', '親子丼の具', 101, 8.4, 5.2, 5.6],
  ['おかず・惣菜', '18031', '牛飯の具', 122, 4.1, 9.4, 6.4],
  ['おかず・惣菜', '18037', 'ひじきのいため煮', 75, 3.1, 4.0, 9.9],
  ['おかず・惣菜', '18032', '切り干し大根の煮物', 48, 2.3, 2.5, 5.7],
  ['おかず・惣菜', '18029', '卯の花いり', 84, 4.4, 4.1, 10.7],
  ['おかず・惣菜', '18024', '青菜の白和え', 81, 4.2, 3.4, 10.5],
  ['おかず・惣菜', '18028', 'とん汁', 26, 1.5, 1.5, 2.0],
  ['おかず・惣菜', '18049', '麻婆豆腐', 104, 7.8, 6.8, 3.8],
  ['おかず・惣菜', '18047', '酢豚', 77, 4.6, 3.3, 7.6],
  ['おかず・惣菜', '18048', '八宝菜', 64, 5.8, 3.2, 3.8],
  ['おかず・惣菜', '18002', 'ぎょうざ', 209, 6.9, 11.3, 22.3],
  ['おかず・惣菜', '18012', 'しゅうまい', 191, 9.1, 9.2, 19.5],
  ['おかず・惣菜', '18050', '合いびきハンバーグ', 197, 13.4, 12.2, 10.0],
  ['おかず・惣菜', '18051', 'チキンハンバーグ', 171, 12.6, 10.2, 8.5],
  ['おかず・惣菜', '18052', '豆腐ハンバーグ', 142, 9.9, 9.2, 8.4],
  ['おかず・惣菜', '18018', 'ポテトコロッケ', 226, 5.3, 12.6, 25.2],
  ['おかず・惣菜', '18022', 'メンチカツ', 273, 10.7, 18.7, 18.7],
  ['おかず・惣菜', '18020', 'えびフライ', 236, 15.9, 11.6, 20.5],
  ['おかず・惣菜', '18040', 'チキンカレー', 131, 5.6, 8.8, 8.4],
  ['おかず・惣菜', '18001', 'ビーフカレー', 119, 2.4, 9.0, 8.1],
  ['おかず・惣菜', '18045', 'チキンシチュー', 124, 6.2, 8.0, 7.8],
  ['おかず・惣菜', '18014', 'えびピラフ', 146, 3.3, 2.3, 29.8],
  ['おかず・惣菜', '18039', 'もやしのナムル', 70, 3.1, 4.5, 5.7],
  ['お刺身・魚', '10254', 'くろまぐろ(天然・脂身・生)', 308, 20.1, 27.5, 0.1],
  ['お刺身・魚', '10450', 'くろまぐろ(養殖・赤身・生)', 153, 24.8, 7.6, 0.3],
  ['お刺身・魚', '10425', 'めばち(赤身・生)', 115, 25.4, 2.3, 0.3],
  ['お刺身・魚', '10086', 'かつお(春獲り・生)', 108, 25.8, 0.5, 0.1],
  ['お刺身・魚', '10087', 'かつお(秋獲り・生)', 150, 25.0, 6.2, 0.2],
  ['お刺身・魚', '10003', 'まあじ(皮つき・生)', 112, 19.7, 4.5, 0.1],
  ['お刺身・魚', '10047', 'まいわし(生)', 156, 19.2, 9.2, 0.2],
  ['お刺身・魚', '10154', 'まさば(生)', 211, 20.6, 16.8, 0.3],
  ['お刺身・魚', '10156', 'まさば(焼き)', 264, 25.2, 22.4, 0.4],
  ['お刺身・魚', '10136', 'しろさけ(焼き)', 160, 29.1, 5.1, 0.1],
  ['お刺身・魚', '10139', '塩ざけ', 183, 22.4, 11.1, 0.1],
  ['お刺身・魚', '10144', 'サーモン(たいせいようさけ・養殖・皮つき・生)', 218, 20.1, 16.5, 0.1],
  ['お刺身・魚', '10241', 'ぶり(成魚・生)', 222, 21.4, 17.6, 0.3],
  ['お刺身・魚', '10243', 'はまち(養殖・皮つき・生)', 217, 20.7, 17.2, 0.3],
  ['お刺身・魚', '10192', 'まだい(天然・生)', 129, 20.6, 5.8, 0.1],
  ['お刺身・魚', '10234', 'ひらめ(天然・生)', 94, 20.0, 2.0, 0.0],
  ['お刺身・魚', '10173', 'さんま(皮つき・生)', 287, 18.1, 25.6, 0.1],
  ['お刺身・魚', '10174', 'さんま(皮つき・焼き)', 281, 23.3, 22.8, 0.2],
  ['お刺身・魚', '10396', 'しらす(生)', 67, 15.0, 1.3, 0.1],
  ['お刺身・魚', '10055', 'しらす干し(微乾燥)', 113, 24.5, 2.1, 0.1],
  ['お刺身・魚', '10202', 'たらこ(生)', 131, 24.0, 4.7, 0.4],
  ['お刺身・魚', '10070', 'うなぎ(かば焼)', 285, 23.0, 21.0, 3.1],
  ['お刺身・魚', '10140', 'いくら', 252, 32.6, 15.6, 0.2],
  ['お刺身・魚', '10261', 'ツナ缶(水煮・フレーク・ホワイト)', 96, 18.3, 2.5, 0.4],
  ['お刺身・魚', '10164', 'さば缶(水煮)', 174, 20.9, 10.7, 0.2],
  ['お刺身・魚', '10376', 'かに風味かまぼこ', 89, 12.1, 0.5, 9.2],
  ['お刺身・魚', '10381', '焼き竹輪', 119, 12.2, 2.0, 13.5],
  ['お刺身・魚', '10388', '魚肉ソーセージ', 158, 11.5, 7.2, 12.6],
  ['イカ・タコ・貝・えび・かに', '10345', 'するめいか(生)', 76, 17.9, 0.8, 0.1],
  ['イカ・タコ・貝・えび・かに', '10418', 'するめいか(胴・皮なし・生)', 80, 18.6, 0.6, 0.1],
  ['イカ・タコ・貝・えび・かに', '10352', 'やりいか(生)', 79, 17.6, 1.0, 0.4],
  ['イカ・タコ・貝・えび・かに', '10361', 'まだこ(生)', 70, 16.4, 0.7, 0.1],
  ['イカ・タコ・貝・えび・かに', '10362', 'まだこ(ゆで)', 91, 21.7, 0.7, 0.1],
  ['イカ・タコ・貝・えび・かに', '10281', 'あさり(生)', 27, 6.0, 0.3, 0.4],
  ['イカ・タコ・貝・えび・かに', '10306', 'はまぐり(生)', 35, 6.1, 0.6, 1.8],
  ['イカ・タコ・貝・えび・かに', '10297', 'しじみ(生)', 54, 7.5, 1.4, 4.5],
  ['イカ・タコ・貝・えび・かに', '10311', 'ほたてがい(生)', 66, 13.5, 0.9, 1.5],
  ['イカ・タコ・貝・えび・かに', '10313', 'ほたてがい貝柱(生)', 82, 16.9, 0.3, 3.5],
  ['イカ・タコ・貝・えび・かに', '10292', 'かき(養殖・生)', 58, 6.9, 2.2, 4.9],
  ['イカ・タコ・貝・えび・かに', '10430', 'かき(養殖・フライ)', 256, 7.6, 11.1, 32.9],
  ['イカ・タコ・貝・えび・かに', '10427', 'くろあわび(生)', 76, 14.3, 0.8, 3.6],
  ['イカ・タコ・貝・えび・かに', '10319', 'あまえび(生)', 85, 19.8, 1.5, 0.1],
  ['イカ・タコ・貝・えび・かに', '10321', 'くるまえび(養殖・生)', 90, 21.6, 0.6, 0.0],
  ['イカ・タコ・貝・えび・かに', '10415', 'バナメイえび(養殖・生)', 82, 19.6, 0.6, 0.7],
  ['イカ・タコ・貝・えび・かに', '10329', 'ブラックタイガー(養殖・生)', 77, 18.4, 0.3, 0.3],
  ['イカ・タコ・貝・えび・かに', '10336', 'ずわいがに(ゆで)', 65, 15.0, 0.6, 0.1],
  ['イカ・タコ・貝・えび・かに', '10339', 'たらばがに(ゆで)', 77, 17.5, 1.5, 0.3],
  ['イカ・タコ・貝・えび・かに', '10365', 'うに(生うに)', 109, 16.0, 4.8, 3.3],
  ['イカ・タコ・貝・えび・かに', '10358', 'いかの塩辛', 114, 15.2, 3.4, 6.5],
  ['チーズ・ヨーグルト・乳製品', '13005', '加工乳(低脂肪)', 42, 3.8, 1.0, 5.5],
  ['チーズ・ヨーグルト・乳製品', '13006', '脱脂乳', 31, 3.4, 0.1, 4.8],
  ['チーズ・ヨーグルト・乳製品', '13053', 'ヨーグルト(低脂肪無糖)', 40, 3.7, 1.0, 5.2],
  ['チーズ・ヨーグルト・乳製品', '13054', 'ヨーグルト(無脂肪無糖)', 37, 4.0, 0.3, 5.7],
  ['チーズ・ヨーグルト・乳製品', '13026', 'ヨーグルト(脱脂加糖)', 65, 4.3, 0.2, 11.9],
  ['チーズ・ヨーグルト・乳製品', '13027', 'ヨーグルトドリンク(加糖)', 64, 2.9, 0.5, 12.2],
  ['チーズ・ヨーグルト・乳製品', '13040', 'プロセスチーズ', 313, 22.7, 26.0, 1.3],
  ['チーズ・ヨーグルト・乳製品', '13033', 'カテージチーズ', 99, 13.3, 4.5, 1.9],
  ['チーズ・ヨーグルト・乳製品', '13034', 'カマンベールチーズ', 291, 19.1, 24.7, 0.9],
  ['チーズ・ヨーグルト・乳製品', '13056', 'モッツァレラチーズ', 269, 18.4, 19.9, 4.2],
  ['チーズ・ヨーグルト・乳製品', '13035', 'クリームチーズ', 313, 8.2, 33.0, 2.3],
  ['チーズ・ヨーグルト・乳製品', '13038', 'パルメザンチーズ', 445, 44.0, 30.8, 1.9],
  ['チーズ・ヨーグルト・乳製品', '13014', '生クリーム(乳脂肪)', 404, 1.9, 43.0, 6.5],
  ['アイス・お菓子・デザート', '13042', 'アイスクリーム(高脂肪)', 205, 3.5, 12.0, 22.4],
  ['アイス・お菓子・デザート', '13043', 'アイスクリーム(普通脂肪)', 178, 3.9, 8.0, 23.2],
  ['アイス・お菓子・デザート', '13044', 'アイスミルク', 167, 3.4, 6.4, 23.9],
  ['アイス・お菓子・デザート', '13047', 'ソフトクリーム', 146, 3.8, 5.6, 20.1],
  ['アイス・お菓子・デザート', '13049', 'シャーベット', 128, 0.9, 1.0, 28.7],
  ['アイス・お菓子・デザート', '15086', 'カスタードプリン', 116, 5.7, 5.5, 14.0],
  ['アイス・お菓子・デザート', '15170', 'ショートケーキ(いちご)', 314, 6.9, 14.7, 42.7],
  ['アイス・お菓子・デザート', '15134', 'ベイクドチーズケーキ', 299, 8.5, 21.2, 23.3],
  ['アイス・お菓子・デザート', '15135', 'レアチーズケーキ', 348, 5.8, 27.5, 21.9],
  ['アイス・お菓子・デザート', '15073', 'シュークリーム', 223, 6.0, 11.4, 25.5],
  ['アイス・お菓子・デザート', '15083', 'ホットケーキ', 253, 7.7, 5.4, 45.3],
  ['アイス・お菓子・デザート', '15027', 'どら焼(つぶしあん)', 292, 6.6, 3.2, 57.9],
  ['アイス・お菓子・デザート', '15023', '大福もち(こしあん入り)', 223, 4.6, 0.5, 53.2],
  ['アイス・お菓子・デザート', '15038', '練りようかん', 289, 3.6, 0.2, 69.9],
  ['アイス・お菓子・デザート', '15009', 'カステラ', 312, 7.1, 5.0, 61.8],
  ['アイス・お菓子・デザート', '15077', 'ドーナッツ(イースト・プレーン)', 379, 7.2, 20.2, 43.9],
  ['アイス・お菓子・デザート', '15116', 'ミルクチョコレート', 551, 6.9, 34.1, 55.8],
  ['アイス・お菓子・デザート', '15103', 'ポテトチップス', 541, 4.7, 35.2, 54.7],
  ['アイス・お菓子・デザート', '15069', 'あんパン(こしあん入り)', 253, 6.8, 3.6, 53.5],
  ['アイス・お菓子・デザート', '15132', 'メロンパン', 349, 8.0, 10.5, 59.9],
  ['アイス・お菓子・デザート', '15087', 'ゼリー(オレンジ)', 79, 2.1, 0.1, 19.8],
  ['アイス・お菓子・デザート', '15142', 'こんにゃくゼリー', 65, 0.0, 0.1, 16.4],
  ['アイス・お菓子・デザート', '15113', 'マシュマロ', 324, 2.1, 0.0, 79.3],
  ['アイス・お菓子・デザート', '15137', 'アーモンドチョコレート', 562, 11.4, 40.4, 43.3],
  ['アイス・お菓子・デザート', '15080', 'アップルパイ', 294, 4.0, 17.5, 32.8],
  ['アイス・お菓子・デザート', '15035', '肉まん', 242, 10.0, 5.1, 43.4],
];
const EXTRA_CATS = [...new Set(EXTRA_ROWS.map((r) => r[0]))];
const EXTRA_FOODS = EXTRA_ROWS.map(([cat, no, name, kcal, p, f, c]) =>
  ({ id: 'extra:' + no, no, name, basis: 'g100', kcal, p, f, c, cat, src: EXTRA_SRC }));
const findFood = (id) => state.foods.find((f) => f.id === id) ||
  PRESET_FOODS.find((f) => f.id === id) || EXTRA_FOODS.find((f) => f.id === id);

const LEVELS = {
  light: { met: 3.5, label: '軽〜中(複数種目・8〜15rep)' },
  mid: { met: 5.0, label: '中(スクワット・デッドリフト等)' },
  vigorous: { met: 6.0, label: '強(パワーリフティング・ボディビル)' },
};

const $ = (id) => document.getElementById(id);

/* ===== 保存・読み込み ===== */
function emptyState() {
  return { exercises: [], workouts: [], bodyRecords: [], meals: [], foods: [], burns: [], profile: { age: null, sex: '' } };
}

const isObj = (o) => o !== null && typeof o === 'object';
const isDate = (s) => typeof s === 'string' && DATE_RE.test(s) && !isNaN(new Date(s + 'T00:00:00'));
const isNumOrNull = (v) => v === null || (typeof v === 'number' && Number.isFinite(v));

function isExercise(o) {
  return isObj(o) && typeof o.id === 'string' && typeof o.name === 'string' && PARTS.includes(o.bodyPart);
}
function isWorkout(o) {
  return isObj(o) && typeof o.id === 'string' && typeof o.exerciseId === 'string' && isDate(o.date) &&
    typeof o.weight === 'number' && Number.isFinite(o.weight) &&
    (o.weightUnit === 'kg' || o.weightUnit === 'lb') &&
    Number.isSafeInteger(o.reps) && typeof o.createdAt === 'number' &&
    (o.note === undefined || (typeof o.note === 'string' && Array.from(o.note).length <= 20)) &&
    (o.type === undefined || ['warmup', 'main', 'drop'].includes(o.type));
}
function isBody(o) {
  return isObj(o) && typeof o.id === 'string' && isDate(o.date) &&
    isNumOrNull(o.heightCm) && isNumOrNull(o.weightKg) && typeof o.createdAt === 'number' &&
    (o.time === undefined || o.time === null || /^\d{2}:\d{2}$/.test(o.time));
}

function isMeal(o) {
  return isObj(o) && typeof o.id === 'string' && isDate(o.date) && typeof o.name === 'string' &&
    Number.isFinite(o.kcal) && typeof o.createdAt === 'number';
}
function isFood(o) {
  return isObj(o) && typeof o.id === 'string' && typeof o.name === 'string' &&
    (o.basis === 'g100' || o.basis === 'serving') && Number.isFinite(o.kcal);
}
function isBurn(o) {
  return isObj(o) && typeof o.id === 'string' && isDate(o.date) && Number.isSafeInteger(o.minutes) &&
    Object.prototype.hasOwnProperty.call(LEVELS, o.level) && typeof o.createdAt === 'number';
}
function isProfile(o) {
  return isObj(o) && Number.isSafeInteger(o.age) && (o.sex === 'male' || o.sex === 'female');
}

// 保存データ・バックアップを、形式の合うものだけ残して整える
function normalizeState(d) {
  const arr = (v) => (Array.isArray(v) ? v : []);
  return {
    exercises: arr(d.exercises).filter(isExercise),
    workouts: arr(d.workouts).filter(isWorkout),
    bodyRecords: arr(d.bodyRecords).filter(isBody),
    meals: arr(d.meals).filter(isMeal),
    foods: arr(d.foods).filter(isFood),
    burns: arr(d.burns).filter(isBurn),
    profile: isProfile(d.profile) ? { age: d.profile.age, sex: d.profile.sex } : { age: null, sex: '' },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const d = JSON.parse(raw);
    if (!isObj(d)) return emptyState();
    return normalizeState(d);
  } catch (e) {
    return emptyState(); // 壊れたJSONや保存領域が使えない場合は空で起動
  }
}

let state = load();

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    return false;
  }
}

// 変更を加えて保存する。保存に失敗したら元に戻して false を返す。
function commit(mutator) {
  const before = JSON.stringify(state);
  mutator();
  if (save()) return true;
  state = JSON.parse(before);
  return false;
}

/* ===== 補助関数 ===== */
function newId() {
  if (window.crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// 登録順を保証するため、既存より必ず大きい値にする
function nextCreatedAt() {
  const max = [...state.workouts, ...state.bodyRecords].reduce((m, r) => Math.max(m, r.createdAt), 0);
  return Math.max(Date.now(), max + 1);
}

// 端末のローカル日付(toISOString は UTC になるため使わない)
function todayStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// 重複判定用: 前後の空白除去、全角半角と大文字小文字を区別しない
function normalize(s) {
  return s.trim().normalize('NFKC').toLowerCase();
}

// 小数第1桁までの数値文字列を数値に。不正なら null
function parseDecimal1(str) {
  const s = str.trim();
  return DECIMAL1.test(s) ? Number(s) : null;
}

function showError(id, msg) {
  $(id).textContent = msg;
}
function clearErrors() {
  document.querySelectorAll('.error').forEach((p) => { p.textContent = ''; });
}

// textContent / append のみで描画する(innerHTML は使わない)
function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  n.append(...kids);
  return n;
}

function fillPartOptions(select, firstLabel) {
  select.replaceChildren(
    el('option', { value: '' }, firstLabel),
    ...PARTS.map((p) => el('option', { value: p }, partLabel(p)))
  );
}

/* ===== ① 種目 ===== */
function resetExerciseForm() {
  $('exercise-id').value = '';
  $('exercise-name').value = '';
  $('exercise-part').value = '';
  $('exercise-form-title').textContent = '種目を登録';
  $('exercise-submit').textContent = '登録';
  $('exercise-cancel').hidden = true;
}

function startEdit(id) {
  const x = state.exercises.find((e) => e.id === id);
  if (!x) return;
  clearErrors();
  $('exercise-id').value = x.id;
  $('exercise-name').value = x.name;
  $('exercise-part').value = x.bodyPart;
  $('exercise-form-title').textContent = '種目を編集';
  $('exercise-submit').textContent = '更新';
  $('exercise-cancel').hidden = false;
  $('exercise-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('exercise-name').focus();
}

function deleteExercise(id) {
  clearErrors();
  const x = state.exercises.find((e) => e.id === id);
  if (!x) return;
  if (state.workouts.some((w) => w.exerciseId === id)) {
    showError('exercise-list-error', `「${x.name}」は記録で使われているため削除できません。`);
    return;
  }
  if (!confirm(`種目「${x.name}」を削除しますか?`)) return;
  if (!commit(() => { state.exercises = state.exercises.filter((e) => e.id !== id); })) {
    showError('exercise-list-error', '保存に失敗しました。ブラウザの保存設定を確認してください。');
    return;
  }
  if ($('exercise-id').value === id) resetExerciseForm();
  renderAll();
}

$('exercise-form').addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors();
  const id = $('exercise-id').value;
  const name = $('exercise-name').value.trim();
  const part = $('exercise-part').value;

  if (!name) return showError('exercise-error', '種目名を入力してください。');
  if (!PARTS.includes(part)) return showError('exercise-error', '部位を選択してください。');
  const key = normalize(name);
  if (state.exercises.some((x) => x.id !== id && normalize(x.name) === key)) {
    return showError('exercise-error', '同じ名前の種目が既にあります。');
  }
  if (id && !state.exercises.some((x) => x.id === id)) {
    return showError('exercise-error', '編集対象の種目が見つかりません。');
  }

  const ok = commit(() => {
    if (id) {
      const t = state.exercises.find((x) => x.id === id);
      t.name = name;
      t.bodyPart = part;
    } else {
      state.exercises.push({ id: newId(), name, bodyPart: part });
    }
  });
  if (!ok) return showError('exercise-error', '保存に失敗しました。ブラウザの保存設定を確認してください。');

  resetExerciseForm();
  renderAll();
});

$('exercise-cancel').addEventListener('click', () => {
  clearErrors();
  resetExerciseForm();
});

// 検索・絞り込み
function filteredExercises() {
  const q = normalize($('filter-text').value);
  const p = $('filter-part').value;
  return state.exercises.filter((x) =>
    (!q || normalize(x.name).includes(q)) && (!p || x.bodyPart === p));
}

$('filter-text').addEventListener('input', renderExercises);
$('filter-part').addEventListener('change', renderExercises);
$('filter-clear').addEventListener('click', () => {
  $('filter-text').value = '';
  $('filter-part').value = '';
  renderExercises();
});

function renderExercises() {
  const list = $('exercise-list');
  list.replaceChildren();
  const items = filteredExercises();
  const total = state.exercises.length;
  $('exercise-count').textContent = total ? `${total}件中 ${items.length}件を表示` : '';

  if (!items.length) {
    list.append(el('li', { class: 'empty' },
      total ? '条件に合う種目がありません。' : 'まだ種目がありません。上のフォームから登録してください。'));
    return;
  }
  items.forEach((x) => {
    list.append(el('li', { class: 'row' },
      el('div', { class: 'main' }, el('strong', {}, x.name), el('span', { class: 'tag' }, partLabel(x.bodyPart))),
      el('div', { class: 'btns' },
        el('button', { type: 'button', class: 'sub', onclick: () => startEdit(x.id) }, '編集'),
        el('button', { type: 'button', class: 'danger', onclick: () => deleteExercise(x.id) }, '削除'))));
  });
}

/* ===== ② トレーニング記録 ===== */
function renderExerciseSelect() {
  const sel = $('workout-exercise');
  const cur = sel.value;
  sel.replaceChildren(
    el('option', { value: '' }, '選択してください'),
    ...state.exercises.map((x) => el('option', { value: x.id }, `${x.name}(${partLabel(x.bodyPart)})`))
  );
  if (state.exercises.some((x) => x.id === cur)) sel.value = cur;
  $('workout-hint').hidden = state.exercises.length > 0;
}

$('workout-form').addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors();
  const date = $('workout-date').value;
  const exerciseId = $('workout-exercise').value;
  const unit = $('workout-unit').value;
  const weight = parseDecimal1($('workout-weight').value);
  const repsText = $('workout-reps').value.trim();
  const note = $('workout-note').value.trim();
  const type = $('workout-type').value;

  if (!isDate(date)) return showError('workout-error', '日付を入力してください。');
  if (!state.exercises.some((x) => x.id === exerciseId)) return showError('workout-error', '種目を選択してください。');
  if (unit !== 'kg' && unit !== 'lb') return showError('workout-error', '単位を選択してください。');
  if (!['warmup', 'main', 'drop'].includes(type)) return showError('workout-error', 'セットの種類を選択してください。');
  // weight === 0 は自重として有効。null(不正)だけを弾く
  if (weight === null || weight > 2000) {
    return showError('workout-error', '重量は0〜2000の数値(小数第1桁まで)で入力してください。0は自重です。');
  }
  const reps = INTEGER.test(repsText) ? Number(repsText) : NaN;
  if (!Number.isSafeInteger(reps) || reps < 1) {
    return showError('workout-error', '回数は1以上の整数で入力してください。');
  }
  // メモは任意。文字数は絵文字なども1字として数える
  if (Array.from(note).length > 20) return showError('workout-error', 'メモは20字以内で入力してください。');

  const ok = commit(() => {
    const rec = { id: newId(), exerciseId, date, weight, weightUnit: unit, reps, type, createdAt: nextCreatedAt() };
    if (note) rec.note = note;
    state.workouts.push(rec);
  });
  if (!ok) return showError('workout-error', '保存に失敗しました。ブラウザの保存設定を確認してください。');

  $('workout-weight').value = '';
  $('workout-reps').value = '';
  $('workout-note').value = '';
  renderAll();
  $('workout-weight').focus();
});

function deleteWorkout(id) {
  if (!confirm('この記録を削除しますか?')) return;
  if (!commit(() => { state.workouts = state.workouts.filter((w) => w.id !== id); })) {
    return showError('workout-error', '保存に失敗しました。ブラウザの保存設定を確認してください。');
  }
  renderAll();
}

// 推定1RM(O’Conner式: 重量×(1+0.025×rep))。題材カードの例(80kg×10rep→100kg)と一致する。
// 予測式は、限界に近い10rep以下で精度が高く、それを超えると式ごとのばらつきが大きくなるため、11rep以上は出さない。
// kgのメインセットだけ(0=自重とlbは対象外)。rep=1は重量そのまま
const RM_MAX_REPS = 10;
function estimate1RM(w) {
  if (w.weightUnit !== 'kg' || w.weight <= 0 || w.reps > RM_MAX_REPS) return null;
  if (w.reps === 1) return w.weight;
  return Math.round(w.weight * (1 + 0.025 * w.reps) * 10) / 10;
}

// セットの種類。種類のない古い記録はメイン扱い
const setType = (w) => w.type || 'main';

// 同じ種目の「前回の日」のメインセット(その日より前で最新の日付)
function previousSets(exId, date) {
  const prev = state.workouts.filter((w) => w.exerciseId === exId && w.date < date && setType(w) === 'main');
  if (!prev.length) return [];
  const last = prev.reduce((m, w) => (w.date > m ? w.date : m), '');
  return prev.filter((w) => w.date === last).sort((a, b) => a.createdAt - b.createdAt);
}

// 前回の同じセット番号と比べ、伸びた分だけ返す。落ちた場合は空(表示なし)
function growthText(w, before) {
  if (!before) return '';
  const parts = [];
  const dw = Math.round((w.weight - before.weight) * 10) / 10;
  if (w.weightUnit === before.weightUnit && dw > 0) parts.push(`+${dw} ${w.weightUnit}`);
  if (w.reps > before.reps) parts.push(`+${w.reps - before.reps} rep`);
  return parts.join(' ');
}

// 指定日の記録を種目ごとにまとめた <li> の配列にする(match で種目を絞り込み)
function dayItems(date, match = () => true) {
  const day = state.workouts
    .filter((w) => w.date === date && match(state.exercises.find((x) => x.id === w.exerciseId)))
    .sort((a, b) => a.createdAt - b.createdAt);
  const groups = new Map();
  day.forEach((w) => {
    if (!groups.has(w.exerciseId)) groups.set(w.exerciseId, []);
    groups.get(w.exerciseId).push(w);
  });
  return [...groups].map(([exId, sets]) => {
    const ex = state.exercises.find((x) => x.id === exId);
    const before = previousSets(exId, date);
    return el('li', { class: 'group' },
      el('div', { class: 'group-head' },
        el('strong', {}, ex ? ex.name : '(不明な種目)'),
        ex ? el('span', { class: 'tag' }, partLabel(ex.bodyPart)) : ''),
      ...(() => {
        // セット番号はメインだけ数える。ウォームアップは別に数え、ドロップは番号を付けない
        let mainNo = 0;
        let warmNo = 0;
        return sets.map((w) => {
          const t = setType(w);
          let label = '↳ ドロップ';
          let rm = null;
          let up = '';
          if (t === 'main') {
            mainNo += 1;
            label = `${mainNo}set目`;
            rm = estimate1RM(w);
            up = growthText(w, before[mainNo - 1]);
          } else if (t === 'warmup') {
            warmNo += 1;
            label = `ウォームアップ${warmNo}`;
          }
          return el('div', { class: `set ${t}` },
            el('span', {},
              `${label}  ${w.weight} ${w.weightUnit} × ${w.reps}rep` + (rm === null ? '' : `  → 推定1RM ${rm} kg`),
              up ? el('span', { class: 'up' }, up) : '',
              w.note ? el('span', { class: 'note' }, `📝 ${w.note}`) : ''),
            el('button', { type: 'button', class: 'danger', onclick: () => deleteWorkout(w.id) }, '削除'));
        });
      })());
  });
}

function renderDay(list, date) {
  const items = dayItems(date);
  list.replaceChildren(...(items.length ? items : [el('li', { class: 'empty' }, 'この日の記録はありません。')]));
}

function renderWorkouts() {
  const today = todayStr();
  $('today-title').textContent = `今日(${today})の記録`;
  renderDay($('today-list'), today);
  const d = $('view-date').value;
  if (isDate(d)) {
    renderDay($('view-list'), d);
  } else {
    $('view-list').replaceChildren(el('li', { class: 'empty' }, '日付を選ぶと、その日の記録を表示します。'));
  }
  renderSearch();
}
$('view-date').addEventListener('change', renderWorkouts);

// 全期間の検索(種目名の部分一致 + 部位)。条件が空のときは何も探さない
function renderSearch() {
  const q = normalize($('wf-text').value);
  const p = $('wf-part').value;
  const list = $('wf-list');
  if (!q && !p) {
    list.replaceChildren(el('li', { class: 'empty' }, '種目名か部位を指定すると、全期間の記録から探します。'));
    return;
  }
  const match = (ex) => !!ex && (!q || normalize(ex.name).includes(q)) && (!p || ex.bodyPart === p);
  const dates = [...new Set(state.workouts.map((w) => w.date))].sort().reverse();
  const nodes = [];
  dates.forEach((d) => {
    const items = dayItems(d, match);
    if (items.length) nodes.push(el('li', { class: 'date-head' }, d), ...items);
  });
  list.replaceChildren(...(nodes.length ? nodes : [el('li', { class: 'empty' }, '条件に合う記録がありません。')]));
}
$('wf-text').addEventListener('input', renderSearch);
$('wf-part').addEventListener('change', renderSearch);
$('wf-clear').addEventListener('click', () => {
  $('wf-text').value = '';
  $('wf-part').value = '';
  renderSearch();
});

/* ===== ④ グラフ(総ボリューム = 重量 × rep。kgの記録のみ) ===== */
function fmtDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function nowTime() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}
function weekStart(s) {
  const d = new Date(s + 'T00:00:00');
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // 月曜始まり
  return fmtDate(d);
}

function volumeData(mode) {
  const sums = new Map();
  state.workouts.forEach((w) => {
    if (w.weightUnit !== 'kg' || setType(w) === 'warmup') return;
    const ex = state.exercises.find((x) => x.id === w.exerciseId);
    const key = mode === 'exercise' ? (ex ? ex.name : '(不明な種目)')
      : mode === 'part' ? (ex ? ex.bodyPart : '(不明)')
      : mode === 'day' ? w.date
      : mode === 'week' ? weekStart(w.date)
      : w.date.slice(0, 7);
    sums.set(key, (sums.get(key) || 0) + w.weight * w.reps);
  });
  const rows = [...sums.entries()];
  if (mode === 'exercise' || mode === 'part') return rows.sort((a, b) => b[1] - a[1]);
  return rows.sort((a, b) => a[0].localeCompare(b[0])).slice(-30); // 時系列は直近30件
}

function renderChart() {
  const mode = $('chart-mode').value;
  if (mode.startsWith('kcal-')) return renderKcalChart(mode);
  const box = $('chart');
  box.replaceChildren();
  const lb = state.workouts.filter((w) => w.weightUnit === 'lb').length;
  const timeMode = mode === 'day' || mode === 'week' || mode === 'month';
  $('chart-note').textContent = '総ボリューム = 重量 × rep の合計(kgの記録のみ・ウォームアップを除く)' +
    (lb ? `。lbの記録${lb}件は含みません` : '') + (timeMode ? '。直近30件まで表示' : '');
  const rows = volumeData(mode);
  if (!rows.length) {
    box.append(el('p', { class: 'empty' }, '集計できる記録がありません。'));
    return;
  }
  const max = Math.max(...rows.map((r) => r[1]));
  rows.forEach(([label, v]) => {
    const pct = max > 0 ? Math.max((v / max) * 100, 1) : 0;
    box.append(el('div', { class: 'bar-row' },
      el('span', { class: 'bar-label' }, mode === 'week' ? label + '〜' : mode === 'part' ? partLabel(label) : label),
      el('div', { class: 'bar-track' }, el('div', { class: 'bar', style: `width:${pct}%` })),
      el('span', { class: 'bar-val' }, `${Math.round(v * 10) / 10} kg`)));
  });
}
$('chart-mode').addEventListener('change', renderChart);

/* ===== ③ 身体情報 ===== */
$('body-form').addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors();
  const date = $('body-date').value;
  const time = $('body-time').value;
  const hText = $('body-height').value.trim();
  const wText = $('body-weight').value.trim();

  if (!isDate(date)) return showError('body-error', '日付を入力してください。');
  if (!/^\d{2}:\d{2}$/.test(time)) return showError('body-error', '時刻を入力してください。');
  if (!hText && !wText) return showError('body-error', '身長か体重のどちらかを入力してください。');

  let heightCm = null;
  let weightKg = null;
  if (hText) {
    heightCm = parseDecimal1(hText);
    if (heightCm === null || heightCm < 50 || heightCm > 250) {
      return showError('body-error', '身長は50〜250cmの数値(小数第1桁まで)で入力してください。');
    }
  }
  if (wText) {
    weightKg = parseDecimal1(wText);
    if (weightKg === null || weightKg < 20 || weightKg > 300) {
      return showError('body-error', '体重は20〜300kgの数値(小数第1桁まで)で入力してください。');
    }
  }
  if (state.bodyRecords.filter((r) => r.date === date).length >= MAX_BODY_PER_DAY) {
    return showError('body-error', `同じ日付の記録は${MAX_BODY_PER_DAY}件までです。不要な記録を削除してください。`);
  }

  const ok = commit(() => {
    state.bodyRecords.push({ id: newId(), date, time, heightCm, weightKg, createdAt: nextCreatedAt() });
  });
  if (!ok) return showError('body-error', '保存に失敗しました。ブラウザの保存設定を確認してください。');

  $('body-height').value = '';
  $('body-weight').value = '';
  $('body-time').value = nowTime();
  renderAll();
});

function deleteBody(id) {
  if (!confirm('この記録を削除しますか?')) return;
  if (!commit(() => { state.bodyRecords = state.bodyRecords.filter((r) => r.id !== id); })) {
    return showError('body-error', '保存に失敗しました。ブラウザの保存設定を確認してください。');
  }
  renderAll();
}

function renderBody() {
  const list = $('body-list');
  list.replaceChildren();
  if (!state.bodyRecords.length) {
    list.append(el('li', { class: 'empty' }, 'まだ記録がありません。'));
    return;
  }
  // 日付ごとに一塊。新しい日付が上、同じ日の中は時刻の早い順
  const byDate = new Map();
  state.bodyRecords.forEach((r) => {
    if (!byDate.has(r.date)) byDate.set(r.date, []);
    byDate.get(r.date).push(r);
  });
  [...byDate.keys()].sort().reverse().forEach((date) => {
    const rows = byDate.get(date).sort((a, b) =>
      (a.time || '').localeCompare(b.time || '') || a.createdAt - b.createdAt);
    list.append(el('li', { class: 'group' },
      el('div', { class: 'group-head' }, el('strong', {}, date)),
      ...rows.map((r) => el('div', { class: 'set' },
        el('span', {}, `${r.time || '時刻なし'}  身長 ${r.heightCm === null ? '—' : r.heightCm + ' cm'} / 体重 ${r.weightKg === null ? '—' : r.weightKg + ' kg'}${bmrText(r)}`),
        el('button', { type: 'button', class: 'danger', onclick: () => deleteBody(r.id) }, '削除')))));
  });
}

/* ===== ⑤ カロリー(基礎代謝・摂取・消費・収支) ===== */
// その日以前で、指定項目が入っている最新の身体情報
function latestBody(date, field) {
  const rows = state.bodyRecords.filter((r) => r.date <= date && r[field] !== null);
  rows.sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '') || a.createdAt - b.createdAt);
  return rows.length ? rows[rows.length - 1] : null;
}
// 身長は変わりにくいので、その日以前になければ全期間の最新を使う
const heightAt = (date) => latestBody(date, 'heightCm') || latestBody('9999-12-31', 'heightCm');

// 基礎代謝(Mifflin-St Jeor式)。必要な値が揃わなければ null
function bmrCalc(weightKg, heightCm) {
  const p = state.profile;
  if (!p.age || !p.sex || weightKg === null || heightCm === null) return null;
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161));
}
function bmrAt(date) {
  const w = latestBody(date, 'weightKg');
  const h = heightAt(date);
  return w && h ? bmrCalc(w.weightKg, h.heightCm) : null;
}
function bmrText(r) {
  if (r.weightKg === null) return '';
  const h = r.heightCm !== null ? { heightCm: r.heightCm } : heightAt(r.date);
  const v = h ? bmrCalc(r.weightKg, h.heightCm) : null;
  return v === null ? '' : ` / 基礎代謝 ${v} kcal`;
}

// トレーニングの消費は基礎代謝に上乗せする分なので (METs − 1) を使う(1 MET ≒ 1 kcal/kg/時)
function burnKcal(b, weightKg) {
  return Math.round((LEVELS[b.level].met - 1) * weightKg * b.minutes / 60);
}
function dayKcal(date) {
  const intake = state.meals.filter((m) => m.date === date).reduce((sum, m) => sum + m.kcal, 0);
  const w = latestBody(date, 'weightKg');
  const burn = w ? state.burns.filter((b) => b.date === date).reduce((sum, b) => sum + burnKcal(b, w.weightKg), 0) : 0;
  return { intake, burn, bmr: bmrAt(date) };
}

$('profile-form').addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors();
  const t = $('profile-age').value.trim();
  const age = INTEGER.test(t) ? Number(t) : NaN;
  const sex = $('profile-sex').value;
  if (!(age >= 10 && age <= 120)) return showError('profile-error', '年齢は10〜120の整数で入力してください。');
  if (sex !== 'male' && sex !== 'female') return showError('profile-error', '性別を選択してください。');
  if (!commit(() => { state.profile = { age, sex }; })) {
    return showError('profile-error', '保存に失敗しました。ブラウザの保存設定を確認してください。');
  }
  renderAll();
});

function renderBmr() {
  const today = todayStr();
  const w = latestBody(today, 'weightKg');
  const h = heightAt(today);
  const v = bmrAt(today);
  $('bmr-summary').textContent = v === null
    ? '年齢・性別を保存し、身長と体重を記録すると、基礎代謝(推定)を表示します。'
    : `基礎代謝(推定): ${v} kcal/日(体重 ${w.weightKg} kg [${w.date}]、身長 ${h.heightCm} cm、Mifflin-St Jeor式)`;
}

$('kcal-date').addEventListener('change', renderKcal);
$('goto-kcal-chart').addEventListener('click', () => {
  $('chart-mode').value = 'kcal-day';
  showTab('graph');
  renderChart();
});

$('meal-form').addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors();
  const date = $('kcal-date').value;
  const food = findFood($('meal-food').value);
  let name;
  let kcal;
  let amountText = null;
  let pfc = null;
  if (!isDate(date)) return showError('meal-error', '日付を入力してください。');
  if (food) {
    // 登録済みの食品: 量から自動計算
    const amount = parseDecimal1($('meal-amount').value);
    if (amount === null || amount <= 0 || amount > 10000) {
      return showError('meal-error', '量は0より大きく10000以下の数値(小数第1桁まで)で入力してください。');
    }
    name = food.name;
    kcal = mealKcal(food, amount);
    amountText = `${amount} ${food.basis === 'g100' ? 'g' : '食分'}`;
    if (hasPfc(food)) pfc = mealPfc(food, amount);
  } else {
    // 手入力
    name = $('meal-name').value.trim();
    const t = $('meal-kcal').value.trim();
    kcal = INTEGER.test(t) ? Number(t) : NaN;
    if (!name) return showError('meal-error', 'メニュー名を入力してください。');
    if (!(kcal >= 0 && kcal <= 10000)) return showError('meal-error', 'カロリーは0〜10000の整数で入力してください。');
    pfc = readPfc(['meal-p', 'meal-f', 'meal-c']);
    if (pfc === false) return showError('meal-error', 'P・F・Cは0〜1000の数値(小数第1桁まで)で、3つとも入力してください。');
  }
  const rec = { id: newId(), date, name, kcal, createdAt: nextCreatedAt() };
  if (amountText) rec.amountText = amountText;
  if (pfc) Object.assign(rec, pfc);
  if (!commit(() => { state.meals.push(rec); })) {
    return showError('meal-error', '保存に失敗しました。ブラウザの保存設定を確認してください。');
  }
  $('meal-name').value = '';
  $('meal-kcal').value = '';
  $('meal-amount').value = '';
  ['meal-p', 'meal-f', 'meal-c'].forEach((id) => { $(id).value = ''; });
  renderAll();
  (food ? $('meal-amount') : $('meal-name')).focus();
});

$('burn-form').addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors();
  const date = $('kcal-date').value;
  const t = $('burn-min').value.trim();
  const minutes = INTEGER.test(t) ? Number(t) : NaN;
  const level = $('burn-level').value;
  if (!isDate(date)) return showError('burn-error', '日付を入力してください。');
  if (!(minutes >= 1 && minutes <= 600)) return showError('burn-error', '時間は1〜600分の整数で入力してください。');
  if (!Object.prototype.hasOwnProperty.call(LEVELS, level)) return showError('burn-error', '強度を選択してください。');
  if (!commit(() => { state.burns.push({ id: newId(), date, minutes, level, createdAt: nextCreatedAt() }); })) {
    return showError('burn-error', '保存に失敗しました。ブラウザの保存設定を確認してください。');
  }
  $('burn-min').value = '';
  renderAll();
});

function removeFrom(key, id, errId) {
  if (!confirm('この記録を削除しますか?')) return;
  if (!commit(() => { state[key] = state[key].filter((x) => x.id !== id); })) {
    return showError(errId, '保存に失敗しました。ブラウザの保存設定を確認してください。');
  }
  renderAll();
}

// PFC(たんぱく質・脂質・炭水化物)。値は100gあたり(または1食分あたり)のg。炭水化物は食物繊維を含む
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const hasPfc = (f) => isNum(f.p) && isNum(f.f) && isNum(f.c);
const r1 = (x) => Math.round(x * 10) / 10;
const mealPfc = (food, amount) => {
  const k = amount / (food.basis === 'g100' ? 100 : 1);
  return { p: r1(food.p * k), f: r1(food.f * k), c: r1(food.c * k) };
};
const pfcText = (o) => `P ${o.p} / F ${o.f} / C ${o.c} g`;

// 任意入力のP・F・C(3つ揃っていれば {p,f,c}、全部空なら null、不正なら false)
function readPfc(ids) {
  const t = ids.map((id) => $(id).value.trim());
  if (!t.some((x) => x)) return null;
  const n = t.map((x) => parseDecimal1(x));
  return n.some((v) => v === null || v > 1000) ? false : { p: n[0], f: n[1], c: n[2] };
}

// 登録食品からの自動計算: 100gあたり→ kcal × g ÷ 100 / 1食分あたり→ kcal × 食分
const mealKcal = (food, amount) => Math.round(food.kcal * amount / (food.basis === 'g100' ? 100 : 1));

function updateMealForm() {
  const food = findFood($('meal-food').value);
  $('meal-name-wrap').hidden = !!food;
  $('meal-kcal-wrap').hidden = !!food;
  $('meal-pfc-wrap').hidden = !!food;
  $('meal-amount-wrap').hidden = !food;
  if (food) $('meal-amount-label').textContent = food.basis === 'g100' ? '量(g)' : '量(食分)';
  const amount = food ? parseDecimal1($('meal-amount').value) : null;
  const ok = food && amount !== null && amount > 0 && amount <= 10000;
  const calc = ok ? `計算結果: ${mealKcal(food, amount)} kcal` + (hasPfc(food) ? `(${pfcText(mealPfc(food, amount))})` : '') : '';
  const srcName = food && food.src ? food.src : '日本食品標準成分表(八訂)増補2023年';
  const src = food && food.no
    ? `出典: ${srcName} 食品番号${food.no}(可食部100gあたり${food.kcal} kcal)。殻・骨・皮などを除いた重さで入力`
    : '';
  $('meal-preview').textContent = [calc, src].filter(Boolean).join(' / ');
}
$('meal-food').addEventListener('change', updateMealForm);
$('meal-amount').addEventListener('input', updateMealForm);

$('food-form').addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors();
  const name = $('food-name').value.trim();
  const basis = $('food-basis').value;
  const kcal = parseDecimal1($('food-kcal').value);
  if (!name) return showError('food-error', '食品名を入力してください。');
  if (basis !== 'g100' && basis !== 'serving') return showError('food-error', '基準を選択してください。');
  if (kcal === null || kcal > 10000) return showError('food-error', 'カロリーは0〜10000の数値(小数第1桁まで)で入力してください。');
  if (state.foods.some((f) => normalize(f.name) === normalize(name))) {
    return showError('food-error', '同じ名前の食品が既にあります。');
  }
  const pfc = readPfc(['food-p', 'food-f', 'food-c']);
  if (pfc === false) return showError('food-error', 'P・F・Cは0〜1000の数値(小数第1桁まで)で、3つとも入力してください。');
  if (!commit(() => { state.foods.push(Object.assign({ id: newId(), name, basis, kcal }, pfc || {})); })) {
    return showError('food-error', '保存に失敗しました。ブラウザの保存設定を確認してください。');
  }
  $('food-name').value = '';
  $('food-kcal').value = '';
  ['food-p', 'food-f', 'food-c'].forEach((id) => { $(id).value = ''; });
  renderAll();
});

function renderFoods() {
  const sel = $('meal-food');
  const cur = sel.value;
  const opts = (list) => list.map((f) => el('option', { value: f.id }, f.name));
  sel.replaceChildren(el('option', { value: '' }, '手入力'),
    ...(state.foods.length ? [el('optgroup', { label: '登録した食品' }, ...opts(state.foods))] : []),
    el('optgroup', { label: '日本食品標準成分表(八訂)増補2023年' }, ...opts(PRESET_FOODS)),
    ...EXTRA_CATS.map((c) => el('optgroup', { label: `${c}(食べスコ・八訂2020年版準拠)` }, ...opts(EXTRA_FOODS.filter((f) => f.cat === c)))));
  if (findFood(cur)) sel.value = cur;
  updateMealForm();
  $('food-list').replaceChildren(...(state.foods.length ? state.foods.map((f) => el('li', { class: 'row' },
    el('div', { class: 'main' },
      el('strong', {}, f.name),
      el('span', { class: 'sub-line' }, `${f.basis === 'g100' ? '100gあたり' : '1食分あたり'} ${f.kcal} kcal` + (hasPfc(f) ? `  ${pfcText(f)}` : ''))),
    el('div', { class: 'btns' }, el('button', { type: 'button', class: 'danger', onclick: () => removeFrom('foods', f.id, 'food-error') }, '削除'))))
    : [el('li', { class: 'empty' }, '登録した食品はまだありません。')]));
}

function dayPfc(date) {
  const ms = state.meals.filter((m) => m.date === date);
  const withP = ms.filter(hasPfc);
  const sum = (k) => r1(withP.reduce((t, m) => t + m[k], 0));
  return { p: sum('p'), f: sum('f'), c: sum('c'), missing: ms.length - withP.length };
}

function renderKcal() {
  const date = $('kcal-date').value;
  if (!isDate(date)) {
    ['kcal-summary', 'meal-list', 'burn-list'].forEach((id) => $(id).replaceChildren());
    return;
  }
  const k = dayKcal(date);
  const w = latestBody(date, 'weightKg');
  const bal = k.bmr === null ? null : k.intake - k.bmr - k.burn;
  const lines = [
    ['摂取', `${k.intake} kcal`],
    ['基礎代謝', k.bmr === null ? '未計算(年齢・性別・身長・体重が必要)' : `${k.bmr} kcal`],
    ['トレーニング消費', w ? `${k.burn} kcal` : '未計算(体重の記録が必要)'],
    ['収支', bal === null ? '未計算' : `${bal > 0 ? '+' : ''}${bal} kcal`],
  ];
  const pf = dayPfc(date);
  lines.push(['PFC', pfcText(pf) + (pf.missing ? `(PFCなしの食事${pf.missing}件を除く)` : '')]);
  $('kcal-summary').replaceChildren(...lines.map(([a, b]) =>
    el('div', { class: 'sum-row' }, el('span', {}, a), el('strong', {}, b))));

  const meals = state.meals.filter((m) => m.date === date).sort((a, b) => a.createdAt - b.createdAt);
  $('meal-list').replaceChildren(...(meals.length ? meals.map((m) => el('li', { class: 'row' },
    el('div', { class: 'main' }, el('strong', {}, m.name), el('span', { class: 'sub-line' }, `${typeof m.amountText === 'string' ? m.amountText + ' → ' : ''}${m.kcal} kcal` + (hasPfc(m) ? `  ${pfcText(m)}` : ''))),
    el('div', { class: 'btns' }, el('button', { type: 'button', class: 'danger', onclick: () => removeFrom('meals', m.id, 'meal-error') }, '削除'))))
    : [el('li', { class: 'empty' }, 'この日の食事の記録はありません。')]));

  const burns = state.burns.filter((b) => b.date === date).sort((a, b) => a.createdAt - b.createdAt);
  $('burn-list').replaceChildren(...(burns.length ? burns.map((b) => el('li', { class: 'row' },
    el('div', { class: 'main' },
      el('strong', {}, `${b.minutes}分`),
      el('span', { class: 'sub-line' }, `${LEVELS[b.level].label} → ` + (w ? `約${burnKcal(b, w.weightKg)} kcal` : '体重の記録が必要'))),
    el('div', { class: 'btns' }, el('button', { type: 'button', class: 'danger', onclick: () => removeFrom('burns', b.id, 'burn-error') }, '削除'))))
    : [el('li', { class: 'empty' }, 'この日のトレーニング時間の記録はありません。')]));
}

function renderKcalChart(mode) {
  const unit = mode.slice(5); // day / week / month
  const box = $('chart');
  box.replaceChildren();
  const sums = new Map();
  let skipped = 0;
  [...new Set(state.meals.map((m) => m.date))].forEach((d) => {
    const k = dayKcal(d);
    if (k.bmr === null) { skipped++; return; }
    const key = unit === 'day' ? d : unit === 'week' ? weekStart(d) : d.slice(0, 7);
    sums.set(key, (sums.get(key) || 0) + k.intake - k.bmr - k.burn);
  });
  $('chart-note').textContent = '収支 = 摂取 − 基礎代謝 − トレーニング消費(目安)。食事を記録した日だけ集計。直近30件まで表示' +
    (skipped ? `。基礎代謝を出せない${skipped}日は除外` : '');
  const rows = [...sums].sort((a, b) => a[0].localeCompare(b[0])).slice(-30);
  if (!rows.length) {
    box.append(el('p', { class: 'empty' }, '集計できる記録がありません。'));
    return;
  }
  const max = Math.max(...rows.map((r) => Math.abs(r[1])));
  rows.forEach(([label, v]) => {
    const pct = max > 0 ? Math.max((Math.abs(v) / max) * 100, 1) : 0;
    box.append(el('div', { class: 'bar-row' },
      el('span', { class: 'bar-label' }, unit === 'week' ? label + '〜' : label),
      el('div', { class: 'bar-track' }, el('div', { class: v < 0 ? 'bar neg' : 'bar', style: `width:${pct}%` })),
      el('span', { class: 'bar-val' }, `${v > 0 ? '+' : ''}${Math.round(v)} kcal`)));
  });
}

/* ===== ホーム(ダッシュボード) ===== */
let homeRange = '1m';
const HOME_RANGES = [['1w', 7], ['1m', 30], ['1y', 365], ['ALL', Infinity]];
const DONUT_COLORS = { p: '#ff7a2f', f: '#8b8f96', c: '#3b82f6' };

function svgEl(tag, attrs = {}, ...kids) {
  const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  n.append(...kids);
  return n;
}

function renderHome() {
  const today = todayStr();
  const sets = state.workouts.filter((w) => w.date === today && setType(w) !== 'warmup');
  const vol = Math.round(sets.filter((w) => w.weightUnit === 'kg').reduce((t, w) => t + w.weight * w.reps, 0));
  $('home-date').textContent = today;
  $('home-hero-text').textContent = sets.length
    ? `${sets.length}セット / 総ボリューム ${vol} kg`
    : 'まだ記録がありません。今日のトレーニングを記録しましょう。';

  // カロリー(PFCのエネルギー比でドーナツを塗り分ける)
  const k = dayKcal(today);
  const pf = dayPfc(today);
  $('home-kcal').textContent = String(k.intake);
  const e = { p: pf.p * 4, f: pf.f * 9, c: pf.c * 4 };
  const tot = e.p + e.f + e.c;
  if (tot > 0) {
    const a = (e.p / tot) * 100;
    const b = a + (e.f / tot) * 100;
    $('home-donut').style.background =
      `conic-gradient(${DONUT_COLORS.p} 0 ${a}%, ${DONUT_COLORS.f} ${a}% ${b}%, ${DONUT_COLORS.c} ${b}% 100%)`;
  } else {
    $('home-donut').style.background = '';
  }
  $('home-legend').replaceChildren(...[['p', 'PROTEIN', pf.p], ['f', 'FAT', pf.f], ['c', 'CARBS', pf.c]].map(
    ([key, label, g]) => el('li', {},
      el('span', { class: 'dot', style: `background:${DONUT_COLORS[key]}` }),
      `${label} ${g} g` + (tot > 0 ? `(${Math.round((e[key] / tot) * 100)}%)` : ''))));

  // 3つの数値
  const w = latestBody(today, 'weightKg');
  const bal = k.bmr === null ? null : k.intake - k.bmr - k.burn;
  const tiles = [
    ['体重', w ? w.weightKg : '—', 'kg'],
    ['基礎代謝', k.bmr === null ? '—' : k.bmr, 'kcal'],
    ['今日の収支', bal === null ? '—' : (bal > 0 ? '+' : '') + bal, 'kcal'],
  ];
  $('home-stats').replaceChildren(...tiles.map(([l, v, u]) =>
    el('div', { class: 'stat' }, el('span', {}, l), el('strong', {}, String(v)), el('span', {}, u))));

  // 体重の推移(折れ線)
  $('home-weight-now').textContent = w ? `${w.weightKg} kg` : '';
  $('home-ranges').replaceChildren(...HOME_RANGES.map(([label]) =>
    el('button', { type: 'button', 'aria-pressed': String(label === homeRange), onclick: () => { homeRange = label; renderHome(); } }, label)));
  const days = HOME_RANGES.find((r) => r[0] === homeRange)[1];
  const from = days === Infinity ? 0 : Date.now() - days * 86400000;
  const pts = state.bodyRecords.filter((r) => r.weightKg !== null)
    .map((r) => ({ t: new Date(`${r.date}T${r.time || '00:00'}:00`).getTime(), v: r.weightKg }))
    .filter((p) => p.t >= from)
    .sort((a, b) => a.t - b.t);
  const box = $('home-weight-chart');
  if (pts.length < 2) {
    box.replaceChildren(el('p', { class: 'empty' }, '期間内の体重の記録が2件以上あると、グラフを表示します。'));
    return;
  }
  const W = 320;
  const H = 140;
  const L = 8;
  const R = 8;
  const T = 16;
  const B = 22;
  const tmin = pts[0].t;
  const tmax = pts[pts.length - 1].t;
  let vmin = Math.min(...pts.map((p) => p.v));
  let vmax = Math.max(...pts.map((p) => p.v));
  if (vmin === vmax) { vmin -= 1; vmax += 1; }
  const x = (t) => L + ((t - tmin) / (tmax - tmin || 1)) * (W - L - R);
  const y = (v) => T + (1 - (v - vmin) / (vmax - vmin)) * (H - T - B);
  const line = pts.map((p) => `${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  box.replaceChildren(svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wc', role: 'img', 'aria-label': '体重の推移' },
    svgEl('polygon', { points: `${x(tmin)},${H - B} ${line} ${x(tmax)},${H - B}`, class: 'wc-area' }),
    svgEl('polyline', { points: line, class: 'wc-line' }),
    svgEl('circle', { cx: x(last.t).toFixed(1), cy: y(last.v).toFixed(1), r: 4, class: 'wc-dot' }),
    svgEl('text', { x: L, y: 11, class: 'wc-text' }, `${vmax} kg`),
    svgEl('text', { x: L, y: H - B - 4, class: 'wc-text' }, `${vmin} kg`),
    svgEl('text', { x: L, y: H - 6, class: 'wc-text' }, fmtDate(new Date(tmin))),
    svgEl('text', { x: W - R, y: H - 6, class: 'wc-text', 'text-anchor': 'end' }, fmtDate(new Date(tmax)))));
}
$('home-go-workout').addEventListener('click', () => showTab('workouts'));

/* ===== 背景画像(この端末のブラウザにだけ保存。状態データとは別キー) ===== */
const BG_KEY = 'kintore-memo-bg-v1';
const BG_MAX_CHARS = 2000000; // 保存サイズの上限(文字数)
const BG_URL_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

// 背景は、既定では「なし」。端末に保存された設定があるときだけ表示する
// (以前の「初期画像」の設定は、画像を同梱しなくなったため、なしとして扱う)
function loadBg() {
  try {
    const raw = localStorage.getItem(BG_KEY);
    if (raw === null) return null;
    const d = JSON.parse(raw);
    // 保存値が書き換えられていても、CSSに混ぜないよう形式を確認する
    if (isObj(d) && typeof d.image === 'string' && BG_URL_RE.test(d.image) && Number.isFinite(d.dim)) {
      const num = (v, lo, hi, def) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def);
      return {
        image: d.image,
        dim: num(d.dim, 0, 0.85, 0.4),
        glass: num(d.glass, 0, 0.7, 0.35), // カードの透明度
        x: num(d.x, 0, 100, 50), // 写真の位置(横%)
        y: num(d.y, 0, 100, 50), // 写真の位置(縦%)
        zoom: num(d.zoom, 1, 3, 1), // 拡大(1=画面いっぱい)
      };
    }
  } catch (e) { /* 壊れていれば背景なし */ }
  return null;
}
let bg = loadBg();

function saveBg() {
  try {
    if (bg) localStorage.setItem(BG_KEY, JSON.stringify(bg));
    else localStorage.removeItem(BG_KEY);
    return true;
  } catch (e) {
    return false;
  }
}

function applyBg() {
  const layer = $('bg-layer');
  if (bg) {
    const shade = `rgba(18, 19, 21, ${bg.dim})`;
    layer.style.backgroundImage = `linear-gradient(${shade}, ${shade}), url("${bg.image}")`;
  } else {
    layer.style.backgroundImage = '';
  }
  layer.style.backgroundPosition = bg ? `${bg.x}% ${bg.y}%` : '';
  layer.style.setProperty('--bg-z', String(bg ? bg.zoom : 1));
  layer.style.setProperty('--bg-x', String(bg ? bg.x / 100 : 0.5));
  layer.style.setProperty('--bg-y', String(bg ? bg.y / 100 : 0.5));
  layer.hidden = !bg;
  document.documentElement.style.setProperty('--surface-a', String(bg ? 1 - bg.glass : 1));
  document.body.classList.toggle('has-bg', !!bg);
  if (!bg) document.body.classList.remove('peek');
  $('bg-dim').value = String(Math.round((bg ? bg.dim : 0.4) * 100));
  $('bg-glass').value = String(Math.round((bg ? bg.glass : 0.35) * 100));
  $('bg-x').value = String(bg ? bg.x : 50);
  $('bg-y').value = String(bg ? bg.y : 50);
  $('bg-zoom').value = String(Math.round((bg ? bg.zoom : 1) * 100));
  $('bg-tune').hidden = !bg;
  $('bg-remove').hidden = !bg;
  $('bg-peek').hidden = !bg;
}

// 画像を縮小してJPEGにする(端末の保存容量を使いすぎないため)
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const k = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * k));
      const h = Math.max(1, Math.round(img.naturalHeight * k));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      let out = canvas.toDataURL('image/jpeg', 0.8);
      if (out.length > BG_MAX_CHARS) out = canvas.toDataURL('image/jpeg', 0.6);
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load')); };
    img.src = url;
  });
}

$('bg-file').addEventListener('change', async () => {
  const file = $('bg-file').files[0];
  showError('bg-error', '');
  if (!file) return;
  try {
    if (!file.type.startsWith('image/')) return showError('bg-error', '画像ファイルを選んでください。');
    const image = await fileToDataUrl(file);
    if (!BG_URL_RE.test(image) || image.length > BG_MAX_CHARS) {
      return showError('bg-error', '画像が大きすぎます。小さい画像を選んでください。');
    }
    const prev = bg;
    // 暗さと透明度は引き継ぎ、写真の位置と拡大は初期値に戻す
    bg = { image, dim: bg ? bg.dim : 0.4, glass: bg ? bg.glass : 0.35, x: 50, y: 50, zoom: 1 };
    if (!saveBg()) {
      bg = prev;
      return showError('bg-error', '保存に失敗しました。ブラウザの保存容量を確認してください。');
    }
    applyBg();
  } catch (e) {
    showError('bg-error', '画像を読み込めませんでした。別の画像を試してください。');
  } finally {
    $('bg-file').value = ''; // 同じ画像をもう一度選べるようにする
  }
});

['bg-dim', 'bg-glass', 'bg-x', 'bg-y', 'bg-zoom'].forEach((id) => {
  $(id).addEventListener('input', () => {
    if (!bg) return;
    bg.dim = Number($('bg-dim').value) / 100;
    bg.glass = Number($('bg-glass').value) / 100;
    bg.x = Number($('bg-x').value);
    bg.y = Number($('bg-y').value);
    bg.zoom = Number($('bg-zoom').value) / 100;
    applyBg();
  });
  // 保存は指を離したときだけ(大きな画像の書き込みを減らす)
  $(id).addEventListener('change', () => {
    if (bg && !saveBg()) showError('bg-error', '保存に失敗しました。ブラウザの保存容量を確認してください。');
  });
});
// 画面を一時的に消して、背景だけを見る
$('bg-peek').addEventListener('click', () => {
  const on = document.body.classList.toggle('peek');
  $('bg-peek').textContent = on ? '画面を戻す' : '背景を見る';
  $('bg-peek').setAttribute('aria-pressed', String(on));
});
$('bg-remove').addEventListener('click', () => {
  bg = null;
  saveBg();
  applyBg();
});

/* ===== データのバックアップ(書き出し・読み込み) ===== */
const BACKUP_MAX_BYTES = 5 * 1024 * 1024;

function parseBackup(text) {
  const d = JSON.parse(text);
  if (!isObj(d) || d.app !== 'kintore-memo' || !isObj(d.data)) throw new Error('format');
  return normalizeState(d.data);
}

function exportData() {
  const payload = { app: 'kintore-memo', version: 1, exportedAt: new Date().toISOString(), data: state };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `kintore-memo-${todayStr()}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  $('data-ok').textContent = 'ファイルを書き出しました(背景画像は含みません)。';
}
$('data-export').addEventListener('click', exportData);

$('data-import').addEventListener('change', async () => {
  const file = $('data-import').files[0];
  showError('data-error', '');
  $('data-ok').textContent = '';
  if (!file) return;
  try {
    if (file.size > BACKUP_MAX_BYTES) return showError('data-error', 'ファイルが大きすぎます。');
    const next = parseBackup(await file.text());
    const msg = `いまの記録をすべて、ファイルの内容に置き換えます。よろしいですか?\n` +
      `(トレーニング${next.workouts.length}件、身体情報${next.bodyRecords.length}件、食事${next.meals.length}件)`;
    if (!confirm(msg)) return;
    if (!commit(() => { state = next; })) {
      return showError('data-error', '保存に失敗しました。ブラウザの保存容量を確認してください。');
    }
    resetExerciseForm();
    renderAll();
    $('data-ok').textContent = '読み込みました。';
  } catch (e) {
    showError('data-error', 'このファイルは読み込めません。このアプリで書き出したファイルを選んでください。');
  } finally {
    $('data-import').value = '';
  }
});

// カロリータブ最下部の、食品データの出典と注意書き
function renderKcalNotes() {
  const link = (href, text) => el('a', { href, target: '_blank', rel: 'noopener' }, text);
  $('kcal-notes').replaceChildren(
    el('h3', {}, '食品データの出典'),
    el('ul', {},
      el('li', {}, `公式グループ(${PRESET_FOODS.length}件):文部科学省「日本食品標準成分表(八訂)増補2023年」。食品成分データベースで確認した値です(確認の中心はカロリーで、PFCは一部のみ)。 `,
        link('https://fooddb.mext.go.jp/', '食品成分データベース')),
      el('li', {}, `その他(${EXTRA_FOODS.length}件):「食べスコ」に載っている、日本食品標準成分表2020年版(八訂)準拠の値です。1件ずつ公式とは照合しておらず、2023年の更新や2026年の正誤表で変わった食品は、公式の値と違う場合があります。 `,
        link('https://tabesco.webtools-kit.net/', '食べスコ'))),
    el('h3', {}, '注意'),
    el('ul', {},
      el('li', {}, '食品の量は、殻・骨・皮などを除いた「可食部」の重さで入力してください。'),
      el('li', {}, '生・焼き・ゆでなど、調理の状態で値が変わります。食品の状態に合うものを選んでください。'),
      el('li', {}, 'カロリーとPFCは目安で、実際の食品や商品とは差があります。炭水化物は食物繊維を含む値のため、P×4+F×9+C×4はカロリーと一致しません。'),
      el('li', {}, '基礎代謝は Mifflin-St Jeor 式、トレーニングの消費は、入力した時間と強度(METs)から計算した目安値です。通勤や家事などの活動は含まれません。')));
}

/* ===== 画面切り替え・初期化 ===== */
function showTab(name) {
  document.querySelectorAll('.panel').forEach((p) => { p.hidden = p.id !== 'tab-' + name; });
  document.querySelectorAll('[data-tab]').forEach((b) => {
    b.setAttribute('aria-selected', String(b.dataset.tab === name));
  });
}

function renderAll() {
  renderExercises();
  renderExerciseSelect();
  renderWorkouts();
  renderBody();
  renderChart();
  renderBmr();
  renderKcal();
  renderFoods();
  renderHome();
}

document.querySelectorAll('[data-tab]').forEach((b) => {
  b.addEventListener('click', () => showTab(b.dataset.tab));
});

fillPartOptions($('exercise-part'), '選択してください');
fillPartOptions($('filter-part'), 'すべての部位');
fillPartOptions($('wf-part'), 'すべての部位');
$('workout-date').value = todayStr();
$('body-date').value = todayStr();
$('body-time').value = nowTime();
$('kcal-date').value = todayStr();
$('burn-level').replaceChildren(...Object.entries(LEVELS).map(([k, v]) => el('option', { value: k }, `${v.label} METs ${v.met}`)));
if (state.profile.age) {
  $('profile-age').value = String(state.profile.age);
  $('profile-sex').value = state.profile.sex;
}
renderAll();
applyBg();
renderKcalNotes();
showTab('home');

// オフライン対応(公開した https のページで、manifest がある場合だけ登録する)
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol) &&
    document.querySelector('link[rel="manifest"]')) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* 登録できなくてもアプリは動く */ });
}
