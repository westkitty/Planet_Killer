import test from 'node:test';
import assert from 'node:assert/strict';
import { targetAt, historicalTarget, epochById, angularDistanceDeg } from '../src/simulation/target.js';
import { CHAPTERS, chapterAtTime, sliderToTime, timeToSlider, visualStateAtTime, formatModelTime } from '../src/simulation/timeline.js';

test('modern and 66 Ma epochs are distinct', () => assert.notEqual(epochById('modern').sourceId, epochById('cretaceous66').sourceId));
test('historical target carries proxy caveat', () => assert.match(historicalTarget().uncertaintyNote,/proxy/i));
test('historical target is sulfate-rich regional class', () => assert.ok(historicalTarget().sulfatePotential > .7));
test('present-day mid-Pacific point is ocean', () => assert.equal(targetAt({epochId:'modern',longitude:-150,latitude:0}).medium,'ocean'));
test('present-day central North America point is land', () => assert.equal(targetAt({epochId:'modern',longitude:-100,latitude:40}).medium,'land'));
test('angular distance is zero for same point', () => assert.equal(angularDistanceDeg(4,5,4,5),0));
test('timeline includes eleven required chapters', () => assert.equal(CHAPTERS.length,11));
test('chapter at contact is contact', () => assert.equal(chapterAtTime(0).id,'contact'));
test('slider/time mapping round-trips approximately', () => {
  for (const v of [0,100,250,500,750,1000]) assert.ok(Math.abs(timeToSlider(sliderToTime(v))-v) < 2.5);
});
test('rewind state is deterministic', () => assert.deepEqual(visualStateAtTime(7200), visualStateAtTime(7200)));
test('contact flash peaks after impact', () => assert.ok(visualStateAtTime(.3).contactFlash > visualStateAtTime(10).contactFlash));
test('formatModelTime handles before-impact time', () => assert.match(formatModelTime(-12),/before impact/));
