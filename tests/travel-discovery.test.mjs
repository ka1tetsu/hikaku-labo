import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DESTINATION_CATALOG, DESTINATION_REGIONS, INTERESTS } from '../src/travel/destinations.js';
import { matchDestination, searchDestinations, destinationMatch, suggestDestinations, makeItinerary, rankPlanStyles, shareableTripUrl, STYLES } from '../src/travel/recommender.js';
import { calculateTravelBudget } from '../src/travel/budget.js';
import { YAHOO_TRAVEL_A8_CREATIVES } from '../src/travel/a8TravelAds.js';

const get=id=>DESTINATION_CATALOG.find(d=>d.id===id);

test('catalog has 18 domestic and worldwide overseas destinations with complete data',()=>{
  const domestic=DESTINATION_CATALOG.filter(d=>d.area==='domestic');
  const overseas=DESTINATION_CATALOG.filter(d=>d.area==='overseas');
  assert.equal(domestic.length,18);
  assert.ok(overseas.length>=60);
  assert.equal(new Set(DESTINATION_CATALOG.map(x=>x.id)).size,DESTINATION_CATALOG.length);
  assert.ok(DESTINATION_REGIONS.length>=17);
  for(const d of DESTINATION_CATALOG){
    assert.ok(d.name&&d.nameEn&&d.region&&d.note&&d.tagline&&d.access,d.id);
    assert.match(d.country,/^[A-Z]{2}$/);
    assert.ok(d.source.startsWith(d.area==='domestic'?'https://www.japan.travel/':'https://www.anzen.mofa.go.jp/'));
    assert.ok(d.aliases.includes(d.name));
    assert.ok(d.interests.every(id=>INTERESTS.some(i=>i.id===id)));
    assert.ok(d.bestMonths.length>0&&d.bestMonths.every(m=>m>=1&&m<=12),d.id);
    assert.ok(d.costLevel>=1&&d.costLevel<=5&&Number.isFinite(d.hours),d.id);
    if(d.flight) assert.match(d.flight.city+d.flight.airport,/^[A-Z]{6}$/);
    for(const style of STYLES){
      assert.ok(d.routes[style.id].length>=6,d.name+' '+style.id);
      assert.equal(new Set(d.routes[style.id]).size,d.routes[style.id].length);
    }
  }
});

test('destination lookup supports Japanese and Roman-letter search without hallucinated matches',()=>{
  assert.equal(matchDestination('京都').id,'kyoto');
  assert.equal(matchDestination('ＫＹＯＴＯ').id,'kyoto');
  assert.equal(matchDestination('東京').id,'tokyo');
  assert.equal(matchDestination('さど').id,'sado');
  assert.equal(matchDestination('沖縄').id,'naha');
  assert.equal(matchDestination('  新潟市 ').id,'niigata');
  assert.ok(searchDestinations('金沢').some(x=>x.id==='kanazawa'));
  assert.equal(matchDestination('火星のホテル'),null);
});

test('destination comparison uses interests, not fabricated hotel prices or paid rankings',()=>{
  assert.equal(destinationMatch(get('kyoto'),['history','food']),2);
  const suggestions=suggestDestinations({interests:['history'],region:'関西'});
  assert.ok(suggestions.length>=3);
  assert.ok(suggestions.every(d=>d.region==='関西'));
  assert.equal(suggestDestinations({query:'札幌'}).length,1);
  assert.equal(suggestDestinations({query:'nonexistent-neverland'}).length,0);
});

test('three themed plans are deterministic and adapt to pace and duration',()=>{
  const destination=get('kanazawa');
  const ranked=rankPlanStyles(destination,{interests:['food'],pace:'standard'});
  assert.equal(ranked.length,3);
  assert.equal(ranked[0].id,'food');
  assert.ok(ranked.every(x=>Number.isInteger(x.matchScore)));
  const classic=makeItinerary(destination,'classic',2,'standard');
  assert.equal(classic.length,3);
  assert.deepEqual(classic.flatMap(day=>day.stops),destination.routes.classic);
  const relaxed=makeItinerary(destination,'slow',1,'relaxed');
  assert.equal(relaxed.length,2);
  assert.equal(relaxed[0].stops.length,1);
  const active=makeItinerary(destination,'classic',5,'active');
  assert.equal(active.length,6);
  assert.match(active[2].stops[0],/自由散策/);
  assert.equal(makeItinerary(destination,'classic',0).length,1);
});

test('day trip budget has no accommodation expense and links can be shared',()=>{
  const daytrip=calculateTravelBudget({nights:0,travelers:2,rooms:1,perRoomNight:25000,travelPerPerson:7000,foodPerPersonDay:3500,otherPerPerson:2000});
  assert.equal(daytrip.lodging,0);
  assert.equal(daytrip.meals,7000);
  assert.equal(daytrip.total,25000);
  const url=shareableTripUrl('https://vivlica.com/travel/','kyoto','food',2,'relaxed');
  const parsed=new URL(url);
  assert.equal(parsed.searchParams.get('destination'),'kyoto');
  assert.equal(parsed.searchParams.get('style'),'food');
  assert.equal(parsed.searchParams.get('nights'),'2');
});

test('the exact A8.net ad material is preserved and travel page still reports disclosures',()=>{
  const travel=readFileSync(new URL('../src/travel/TravelPage.jsx',import.meta.url),'utf8');
  const header=readFileSync(new URL('../src/shared/siteDirectory.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../travel/index.html',import.meta.url),'utf8');
  assert.match(html,/Vivlica Travel/);
  assert.match(header,/Vivlica Travel/);
  assert.match(travel,/YAHOO_TRAVEL_A8_CREATIVES/);
  assert.match(travel,/PR・広告/);
  assert.match(travel,/TravelDiscovery/);
  assert.match(YAHOO_TRAVEL_A8_CREATIVES.banner234,/4AZ9C4\+21TRSI\+4ZCO\+65U41/);
  assert.match(YAHOO_TRAVEL_A8_CREATIVES.banner300,/4AZ9C4\+21TRSI\+4ZCO\+65ME9/);
});
