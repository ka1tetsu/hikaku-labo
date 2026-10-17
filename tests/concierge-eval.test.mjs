import test from 'node:test';
import assert from 'node:assert/strict';
import { siteReply } from '../src/shared/siteConcierge.js';

// Regression set: vague and concrete requests in all three areas must reach the right advisor
// and come back with something actionable (cards, a plan, links, a product search or tools).
const cases = [
  // travel vague
  ['どこか旅行に行きたい','travel'],['癒されたい','travel'],['海が見たい','travel'],['どっか連れてって','travel'],['リフレッシュしたい旅','travel'],
  ['初めての海外旅行におすすめは','travel'],['子連れで行きやすい海外','travel'],['女子旅','travel'],['新婚旅行の行き先','travel'],['卒業旅行 安く','travel'],
  ['紅葉を見に行きたい','travel'],['桜が見たい','travel'],['雪を見たい','travel'],['世界遺産めぐり','travel'],['食べ歩きの旅','travel'],
  // travel concrete
  ['ソウル 2泊3日','travel'],['京都の紅葉','travel'],['ハワイ 5泊 家族','travel'],['バンコク行きの飛行機','travel'],['台北のホテル','travel'],
  ['沖縄 3月','travel'],['福岡から韓国','travel'],['ニューヨーク 予算30万','travel'],['ばりとう','travel'],['grand canyon','travel'],
  // products vague
  ['何かプレゼントを探してる','products'],['彼女の誕生日プレゼント','products'],['父の日','products'],['引っ越しで必要なもの','products'],['肩こりがひどい','products'],
  ['朝起きられない','products'],['腰が痛い','products'],['スマホの充電がすぐ切れる','products'],['部屋が乾燥する','products'],['料理を楽にしたい','products'],
  // products concrete
  ['ワイヤレスイヤホン','products'],['いやほん','products'],['ノートパソコン 10万円以下','products'],['ドラム式洗濯機 安い','products'],['iPad','products'],
  ['ルンバみたいなやつ','products'],['5000円以下のモバイルバッテリー','products'],['コーヒーメーカー おすすめ','products'],['Switch','products'],['ダイソンのドライヤー','products'],
  ['米 10kg','products'],['ふるさと納税 牛肉','products'],['ランニングシューズ メンズ','products'],['電動歯ブラシ','products'],['加湿器 静か','products'],
  // tools
  ['ホームページを作りたい','tools'],['ネットショップ','tools'],['ブログ始めたい','tools'],['お店のサイト','tools'],['ECサイトを作るならどれ','tools'],
  ['WordPressのサーバー','tools'],['ノーコードでサイト','tools'],['ハンドメイド作品を売りたい','tools'],['Wixとstudioどっち','tools'],['副業を始めたい','tools'],
];

test('concierge answers vague and concrete requests in the right area', () => {
  const now = new Date('2026-10-17T10:00:00+09:00');
  for (const [text, domain] of cases) {
    const { message } = siteReply(text, {}, { section: 'site', now });
    assert.equal(message.domain, domain, text);
    assert.ok(message.cards?.length || message.itinerary || message.links || message.productQuery?.keyword || message.toolCards?.length, text);
  }
});
