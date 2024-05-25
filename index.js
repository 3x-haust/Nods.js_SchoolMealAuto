import { IgApiClient } from 'instagram-private-api';
import fs from 'fs';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { getMealData } from './mealData.js';
import { createCanvas, loadImage, registerFont } from 'canvas';

dotenv.config();

const instagram = new IgApiClient();

function getDayOfWeek(yyyyMMdd){
  const day = ['일', '월', '화', '수', '목', '금', '토'];
	
  const dayOfWeek = new Date(yyyyMMdd).getDay(); 

  return day[dayOfWeek];
}

export async function createImage(lst, date, n) {
  const W = 1024;
  const H = 1024;

  lst = lst.reverse();

  registerFont('./assets/fonts/NanumSquareRoundEB.ttf', { family: 'NanumSquareRoundEB' });
  const dateFont = '40px "NanumSquareRoundEB"';
  const dateFontColor = 'rgb(0, 0, 0)';

  const image = await loadImage(`./assets/backgrounds/background${n}.jpg`);
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, W, H);

  const parsedDay = date.split('-');
  const text = `${parsedDay[1]}/${parsedDay[2]} (${getDayOfWeek(date)})`;
  ctx.font = dateFont;
  ctx.fillStyle = dateFontColor;
  ctx.textAlign = 'right';
  ctx.fillText(text, W - 450 , 200);

  const mealFont = '57px "NanumSquareRoundEB"';
  const mealFontColor = 'rgb(0, 0, 0)';

  let textL = 630;

  for (let l of lst) {
    ctx.fillStyle = mealFontColor;
    ctx.font = mealFont;
    ctx.textAlign = 'left';
    ctx.fillText(l, H - 860, textL + 150, W - 100);

    textL -= 75;
  }

  const out = fs.createWriteStream(`./assets/results/meal${n}.jpg`);
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

export function getDate() {
  let date = new Date();
  let year = date.getFullYear();
  let month = ("0" + (date.getMonth() + 1)).slice(-2);
  let day = ("0" + date.getDate()).slice(-2);

  let formattedDate = year + "-" + month + "-" + day;
  return formattedDate;
}

// const mealData = await getMealData("2024-05-23");
// createImage(mealData[1].split(' '), "2024-05-23", 1);

instagram.state.generateDevice(process.env.IG_USERNAME);

async function login() {
  await instagram.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
  console.log('✅ 인스타그램 로그인 성공');
}

async function uploadImagesToInstagram() {
  const parsedDay = getDate().split('-');
  const todayDate = `${parsedDay[0]}년 ${parsedDay[1]}월 ${parsedDay[2]}일 ${getDayOfWeek(getDate())}요일`;

  try {
    const images = [0, 1, 2].map(n => ({
      file: fs.readFileSync(`./assets/results/meal${n}.jpg`),
    }));

    await instagram.publish.album({
      items: images,
      caption: `미림마이스터고 급식\n\n${todayDate}\n\n#급식 #미림마이스터고`
    });

    console.log(`✅ 인스타그램 게시물 업로드 성공: meal0.jpg, meal1.jpg, meal2.jpg`);
  } catch (error) {
    console.error(`🛑 게시물 업로드 오류가 났습니다`);
  }
}

//cron.schedule('33 * * * * *', async () => {
cron.schedule('0 0 7 * * 1-5', async () => {
  try {
    await login();

    const mealData = await getMealData(getDate());
    //const mealData = await getMealData("2024-05-23");
    if(mealData == undefined || mealData[0] === '급식 정보가 없습니다.') {
      console.log('🛑 급식 정보가 없습니다.');
      return;
    };
    
    const createImagePromises = [];
    for (let i = 0; i < 3; i++) {
      if(mealData[i] !== undefined)
        createImagePromises.push(createImage(mealData[i].split(' '), getDate(), i));
        //createImagePromises.push(createImage(mealData[i].split(' '), "2024-05-23", i));
    }
    await Promise.all(createImagePromises);

    await uploadImagesToInstagram();
  } catch (error) {
    console.error(error);
    console.error('🛑 오류가 났습니다');
  }
});
