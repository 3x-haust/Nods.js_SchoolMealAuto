import { IgApiClient } from 'instagram-private-api';
import fs from 'fs';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { getMealData } from './mealData.js';
import { createCanvas, loadImage, registerFont } from 'canvas';

dotenv.config();

const instagram = new IgApiClient();

const weekdays = ['월', '화', '수', '목', '금'];
let file = "./meal.jpg"

async function createImage(lst, date, weekday, n) {
  const W = 1024;
  const H = 1024;

  lst = lst.reverse();

  registerFont('./NanumSquareRoundEB.ttf', { family: 'NanumSquareRoundEB' });
  const dateFont = '36px "NanumSquareRoundEB"';
  const dateFontColor = 'rgb(196, 196, 196)';

  const image = await loadImage('./food_background.png');
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, W, H);

  const parsedDay = date.split('-');
  const text = `${parsedDay[0]}년 ${parsedDay[1]}월 ${parsedDay[2]}일 ${weekdays[weekday]}요일`;
  ctx.font = dateFont;
  ctx.fillStyle = dateFontColor;
  ctx.textAlign = 'right';
  ctx.fillText(text, W - 80 , 75);

  const mealFont = '70px "NanumSquareRoundEB"';
  const mealFontColor = 'rgb(71, 122, 255)';

  let textL = 590;

  for (let l of lst) {
    ctx.fillStyle = mealFontColor;
    ctx.font = mealFont;
    ctx.textAlign = 'left';
    ctx.fillText(l, H - 935, textL + 450, W - 100);

    textL -= 85;
  }

  const out = fs.createWriteStream(`./meal${n}.jpg`);
  const stream = canvas.createJPEGStream();
  stream.pipe(out);

  return new Promise((resolve, reject) => {
    out.on('finish', () => {
      console.log(`✅ 이미지 생성 완료: meal${n}.jpg`);
      resolve();
    });
    out.on('error', reject);
  });
}

function getDate() {
  let date = new Date();
  let year = date.getFullYear();
  let month = ("0" + (date.getMonth() + 1)).slice(-2);
  let day = ("0" + date.getDate()).slice(-2);

  let formattedDate = year + "-" + month + "-" + day;
  return formattedDate;
}

instagram.state.generateDevice(process.env.IG_USERNAME);

async function login() {
  await instagram.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
  console.log('✅ 인스타그램 로그인 성공');
}

async function uploadImageToInstagram(n) {
  try {
    const image = fs.readFileSync(`./meal${n}.jpg`);
  
    await instagram.publish.story({
      file: image,
    });

    console.log(`✅ 인스타그램 스토리 업로드 성공: meal${n}.jpg`);
  } catch (error) {
    // console.error(error);
    console.error(`🛑 meal${n}.jpg 스토리 업로드 오류가 났습니다`);
  }
}

cron.schedule('5 * * * * *', async () => {
  try {
    await login();

    const mealData = await getMealData(getDate());
    if(mealData[0] === '급식 정보가 없습니다.') {
      console.log('🛑 급식 정보가 없습니다.');
      return;
    };
    
    const createImagePromises = [];
    for (let i = 0; i < 3; i++) {
      createImagePromises.push(createImage(mealData[i].split(' '), getDate(), new Date().getDay() - 1, i));
    }
    await Promise.all(createImagePromises);

    for (let i = 0; i < 3; i++) {
      await uploadImageToInstagram(i);
    }
  } catch (error) {
    //console.error(error);
    console.error('🛑 오류가 났습니다');
  }
});
