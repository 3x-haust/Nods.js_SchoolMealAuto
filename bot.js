import pkg from 'discord.js';
import dotenv from 'dotenv';
import { getMealData } from './mealData.js';
import { getTimeTableData } from './timeTableData.js';

const { Client, EmbedBuilder, GatewayIntentBits, Events, ActivityType } = pkg;
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async () => {
  console.log(`Ready! Logged in as ${client.user.tag}`);
});

client.on(Events.ClientReady, async () => {
  setInterval(() => {
    client.user.setPresence({
      activities: [{ name: "자바 잡기", type: ActivityType.Playing }],
    });
  }, 1000);

  try {
    await client.application.commands.create({
      name: '급식',
      description: '특정 날짜의 급식 정보를 알려줍니다.',
      options: [
        {
          name: '날짜',
          description: '급식 정보를 확인할 날짜 (YYYY-MM-DD 형식)',
          required: true,
          type: pkg.ApplicationCommandOptionType.String,
        },
      ],
    });

    await client.application.commands.create({
      name: '시간표',
      description: '특정 날짜의 시간표 정보를 알려줍니다.',
      options: [
        {
          name: '날짜',
          description: '시간표 정보를 확인할 날짜 (DD 형식)',
          required: true,
          type: pkg.ApplicationCommandOptionType.String,
        },
      ],
    });
  } catch (error) {
    console.error(error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  const args = interaction.options.get('날짜').value;

  if (commandName === '급식') {
    const date = args; // 요청 날짜
    try {
      const mealData = await getMealData(date);
      if (mealData[0] === '급식 정보가 없습니다.') {
        await interaction.reply("급식 정보가 없습니다.");
        return;
      }
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`${date} 급식 정보`)
        .addFields(
          { name: '조식', value: mealData[0].split(' ').join('\n') },
          { name: '\u200B', value: '\u200B' },
          { name: '중식', value: mealData[1].split(' ').join('\n') },
          { name: '\u200B', value: '\u200B' },
          { name: '석식', value: mealData[2].split(' ').join('\n') }
        );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching meal data:", error);
      await interaction.reply("급식 정보를 불러오는데 문제가 발생했습니다.");
    }
  } else if (commandName === '시간표') {
    const date = args; // 요청 날짜
    try {
      const timeTableData = await getTimeTableData(date);
      if (timeTableData[0] === '시간표 정보가 없습니다.') {
        await interaction.reply("시간표 정보가 없습니다.");
        return;
      }

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`${date}일 시간표 정보`);

      for (let i = 0; i < timeTableData.length; i++) {
        embed.addFields({ name: `${i + 1}교시`, value: timeTableData[i] });
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching meal data:", error);
      await interaction.reply("시간표 정보를 불러오는데 문제가 발생했습니다.");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
