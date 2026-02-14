import { db } from './db.js';
import Replicate from 'replicate';

interface SimulationEvent {
  year: number;
  title: string;
  description: string;
  impact_score: number;
}

interface SimulationPath {
  events: SimulationEvent[];
  title: string;
}

// Use crypto for UUIDs
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
});

async function generateAgeProgressionImage(
  name: string,
  currentAge: number,
  yearOffset: number
): Promise<string> {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      console.log(
        'Replicate token not configured, using placeholder image'
      );
      return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23334155' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='20' fill='%23fff'%3E${name} at age ${currentAge + yearOffset}%3C/text%3E%3C/svg%3E`;
    }

    const ageAtYear = currentAge + yearOffset;
    const prompt = `Professional headshot photo of a ${ageAtYear}-year-old person named ${name}, realistic facial features, natural lighting, studio quality photograph`;

    const output = await replicate.run(
      'stability-ai/sdxl:7762fd07cf82c948538e41f63dcace3b3b3b0f1377d9d1c3acf32fac5aebf59f',
      {
        input: {
          prompt: prompt,
          negative_prompt: 'unrealistic, cartoon, anime, sketch, low quality',
          width: 512,
          height: 512,
          num_inference_steps: 30,
          guidance_scale: 7.5,
        },
      }
    );

    if (Array.isArray(output) && output.length > 0) {
      return output[0] as string;
    }

    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23334155' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='20' fill='%23fff'%3E${name} at age ${ageAtYear}%3C/text%3E%3C/svg%3E`;
  } catch (error) {
    console.log('Image generation skipped, using placeholder');
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23334155' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='20' fill='%23fff'%3E${name} at age ${currentAge + yearOffset}%3C/text%3E%3C/svg%3E`;
  }
}

function generateSimulationEvents(
  name: string,
  age: number,
  personality: string,
  decision: string,
  pathType: 'A' | 'B'
): SimulationPath {
  const isBoldPath = pathType === 'A';
  const scenarios: { [key: string]: SimulationEvent[] } = {
    quit_job_bold: [
      {
        year: 0,
        title: 'The Leap',
        description: `You hand in your resignation letter. After a week of nervous energy, a wave of relief washes over you. You spend the first month reconnecting with yourself and exploring new possibilities.`,
        impact_score: 0.6,
      },
      {
        year: 1,
        title: 'New Venture Launch',
        description: `You've started a freelance consultancy. Early clients are trickling in through word of mouth. The income is unstable but the autonomy feels worth it.`,
        impact_score: 0.65,
      },
      {
        year: 2,
        title: 'Business Growth',
        description: `Your consultancy is gaining traction. You've hired your first part-time contractor. Revenue has grown 40% year-over-year, and you're starting to believe this could work long-term.`,
        impact_score: 0.72,
      },
      {
        year: 3,
        title: 'Network Expansion',
        description: `Speaking engagements and published articles have positioned you as a thought leader. Major corporations are now seeking your expertise for strategic projects.`,
        impact_score: 0.75,
      },
      {
        year: 4,
        title: 'Scaling Team',
        description: `You've hired three full-time employees and moved into a small office. The business is now on track to hit $2M in annual revenue.`,
        impact_score: 0.78,
      },
      {
        year: 5,
        title: 'Major Contract',
        description: `A Fortune 500 company offers you an exclusive consulting agreement worth $1.5M over three years. Your team expands to eight people.`,
        impact_score: 0.82,
      },
      {
        year: 6,
        title: 'Work-Life Balance',
        description: `Despite the success, you've become conscious of working too hard. You implement a four-day work week for your team and rediscover hobbies.`,
        impact_score: 0.8,
      },
      {
        year: 7,
        title: 'Industry Recognition',
        description: `You win "Entrepreneur of the Year" in your field. The recognition opens doors to board positions and advisory roles at tech startups.`,
        impact_score: 0.85,
      },
      {
        year: 8,
        title: 'Mentorship Mission',
        description: `You launch a mentorship program for young entrepreneurs. Seeing them succeed becomes more fulfilling than any individual achievement.`,
        impact_score: 0.83,
      },
      {
        year: 10,
        title: 'A Decade of Growth',
        description: `Your business is now worth an estimated $10M. More importantly, you've built a loyal team, helped dozens of entrepreneurs, and reclaimed your time. You wake up excited about work again.`,
        impact_score: 0.88,
      },
    ],
    quit_job_safe: [
      {
        year: 0,
        title: 'Stay Put',
        description: `You decide to stay at your job but negotiate better terms—flexible hours, remote work days, and a raise. The anxiety subsides as you feel secure again.`,
        impact_score: 0.55,
      },
      {
        year: 1,
        title: 'New Role Opportunity',
        description: `Your employer promotes you to a senior position with expanded responsibilities. The extra income helps pay off some debt.`,
        impact_score: 0.62,
      },
      {
        year: 2,
        title: 'Stability Wins',
        description: `You've been promoted twice now. Your 401(k) is growing steadily, and you've saved enough for a down payment on a house.`,
        impact_score: 0.65,
      },
      {
        year: 3,
        title: 'Homeowner',
        description: `You buy a modest house in the suburbs. The mortgage is manageable, and you're building equity. You feel like you've "made it."`,
        impact_score: 0.68,
      },
      {
        year: 4,
        title: 'Leadership Track',
        description: `You're now managing a team of six people. The responsibility is stressful but the title and salary are impressive. Some days feel hollow.`,
        impact_score: 0.62,
      },
      {
        year: 5,
        title: 'Turning Point',
        description: `You're earning well but feel stuck in a corporate machine. Your boss wants you to pursue the Director track, but the thought exhausts you.`,
        impact_score: 0.58,
      },
      {
        year: 6,
        title: 'Crisis of Meaning',
        description: `You start therapy and realize you've spent six years building someone else's dream. Weekend hobbies feel like the only genuine part of your life.`,
        impact_score: 0.50,
      },
      {
        year: 7,
        title: 'Quiet Rebellion',
        description: `You stop volunteering for extra projects and set strict work hours. Colleagues think you're underperforming. You feel more alive than before.`,
        impact_score: 0.62,
      },
      {
        year: 8,
        title: 'Reconsidering',
        description: `You explore entrepreneurship on the side, running a small side hustle that barely breaks even. The corporate paycheck enables the experiment.`,
        impact_score: 0.65,
      },
      {
        year: 10,
        title: 'Comfortable, But Wondering',
        description: `You're financially secure with a net worth of $800K. You have a nice house, reliable income, and good benefits. But you sometimes wonder "what if?" when you hear about former colleagues who left to start companies.`,
        impact_score: 0.64,
      },
    ],
    move_city_bold: [
      {
        year: 0,
        title: 'The Move',
        description: `You pack up and move to the new city. The first month is exhilarating but lonely. You're sleeping on a friend's couch and everything feels unfamiliar.`,
        impact_score: 0.55,
      },
      {
        year: 1,
        title: 'Network Building',
        description: `You've joined two networking groups and volunteer at a local nonprofit. You're making genuine friends who share your interests.`,
        impact_score: 0.68,
      },
      {
        year: 2,
        title: 'Career Breakthrough',
        description: `You land an ideal job at a company whose culture perfectly matches your values. The role is slightly less lucrative but far more meaningful.`,
        impact_score: 0.75,
      },
      {
        year: 3,
        title: 'Found Community',
        description: `You've become a regular at your favorite coffee shop and volunteer regularly. You attend meetups and conferences. You feel like you belong.`,
        impact_score: 0.78,
      },
      {
        year: 4,
        title: 'Meeting Someone',
        description: `Through a mutual friend, you meet someone who shares your passions. You start dating and feel a deep connection you haven't felt in years.`,
        impact_score: 0.82,
      },
      {
        year: 5,
        title: 'New Chapter',
        description: `You move in together and buy a co-op apartment. Both your careers are flourishing. You're building a life together in this new city.`,
        impact_score: 0.85,
      },
      {
        year: 6,
        title: 'Giving Back',
        description: `You're promoted to lead a team on meaningful projects. You start mentoring junior employees and feel proud of the positive impact.`,
        impact_score: 0.82,
      },
      {
        year: 7,
        title: 'Life Expanding',
        description: `You and your partner travel frequently on weekends. You've established traditions, inside jokes, and a genuine partnership. Friends visit often.`,
        impact_score: 0.84,
      },
      {
        year: 8,
        title: 'Deepening Roots',
        description: `You join the board of your favorite nonprofit. Your partner gets promoted to director. You're both excited about your future here.`,
        impact_score: 0.86,
      },
      {
        year: 10,
        title: 'A City That Chose You Back',
        description: `A decade in and you can't imagine living anywhere else. You have deep friendships, a thriving career, and a partner you love. The city that felt foreign now feels like home.`,
        impact_score: 0.89,
      },
    ],
    move_city_safe: [
      {
        year: 0,
        title: 'Staying Put',
        description: `You decide to stay where you are. The fear of starting over is too great. You feel relieved but also a hint of regret.`,
        impact_score: 0.58,
      },
      {
        year: 1,
        title: 'Status Quo',
        description: `You've settled back into familiar routines. Your old friends are still around, which is comfortable. You stop thinking about the other city.`,
        impact_score: 0.60,
      },
      {
        year: 2,
        title: 'Career Plateau',
        description: `You're in the same role with minimal growth prospects. Your company isn't expanding much. You're making decent money but not progressing.`,
        impact_score: 0.55,
      },
      {
        year: 3,
        title: 'Relationship Drift',
        description: `Your long-term relationship gradually becomes routine. You love each other but the spark has dimmed. You're cohabiting rather than connecting.`,
        impact_score: 0.52,
      },
      {
        year: 4,
        title: 'Missed Opportunities',
        description: `You hear about an incredible job opening in the city you thought about moving to. It's exactly your dream role. Someone else gets it.`,
        impact_score: 0.48,
      },
      {
        year: 5,
        title: 'Regret Surfaces',
        description: `You start having frank conversations with your partner about feeling stuck. You realize you never fully committed to making this relationship or city feel like "home."`,
        impact_score: 0.50,
      },
      {
        year: 6,
        title: 'Major Shift',
        description: `You and your partner break up amicably. It's sad but also feels like relief. You both agree you were holding each other back.`,
        impact_score: 0.45,
      },
      {
        year: 7,
        title: 'Rebuilding Solo',
        description: `For the first time in years, you're single and living alone. You join a dating app and start exploring the city. Slowly, you build a small social circle.`,
        impact_score: 0.58,
      },
      {
        year: 8,
        title: 'Second Wind',
        description: `You finally find a romantic partner who energizes you. You also get promoted at work with a significant raise. Things are looking up.`,
        impact_score: 0.68,
      },
      {
        year: 10,
        title: 'Learning to Appreciate Home',
        description: `You've built a decent life here, but sometimes you wonder if you'd be happier elsewhere. You have stability and old friendships, but not the vibrant community you imagined. Life is comfortable, not exceptional.`,
        impact_score: 0.62,
      },
    ],
    propose_bold: [
      {
        year: 0,
        title: 'The Proposal',
        description: `You propose under the stars. They say yes with tears of joy. The engagement party is filled with loved ones celebrating your commitment.`,
        impact_score: 0.90,
      },
      {
        year: 1,
        title: 'Planning Together',
        description: `Planning the wedding brings you closer. You make decisions as a team. The process is stressful but meaningful. You feel solidified in your choice.`,
        impact_score: 0.85,
      },
      {
        year: 2,
        title: 'Married Life',
        description: `You're officially married. The honeymoon phase extends beyond the ceremony. You're building a shared life with someone you truly love.`,
        impact_score: 0.88,
      },
      {
        year: 3,
        title: 'Growing Together',
        description: `You and your spouse navigate career changes together. When one struggles, the other supports. The partnership feels real and strong.`,
        impact_score: 0.86,
      },
      {
        year: 4,
        title: 'Family Plans',
        description: `You find out you're expecting. The news is overwhelming and joyful. You're about to become parents and you're ready.`,
        impact_score: 0.87,
      },
      {
        year: 5,
        title: 'Parenthood',
        description: `Your child is born and changes everything. The sleep deprivation is real, but so is the love. Your spouse is an amazing co-parent.`,
        impact_score: 0.82,
      },
      {
        year: 6,
        title: 'A Small Family',
        description: `Your child is thriving. You and your spouse have learned to prioritize connection amidst parenting chaos. Date nights are sacred.`,
        impact_score: 0.83,
      },
      {
        year: 7,
        title: 'Legacy Building',
        description: `You're thinking about what kind of parents and people you want to be. Your marriage is a model to your child of healthy partnership.`,
        impact_score: 0.85,
      },
      {
        year: 8,
        title: 'Stronger Than Before',
        description: `A decade in, your marriage has weathered storms and celebrations. You've learned each other's love languages. The commitment has deepened.`,
        impact_score: 0.87,
      },
      {
        year: 10,
        title: 'A Life Well-Shared',
        description: `You look at your spouse across the dinner table and feel an overwhelming sense of gratitude. You made the right choice. The path of commitment has led to a life filled with meaning and partnership.`,
        impact_score: 0.90,
      },
    ],
    propose_safe: [
      {
        year: 0,
        title: 'Holding Back',
        description: `You decide to wait. You tell yourself you need more time. Your partner seems understanding but there's a subtle sadness in their eyes.`,
        impact_score: 0.60,
      },
      {
        year: 1,
        title: 'Testing the Waters',
        description: `You bring up marriage casually. Your partner expresses that they want commitment eventually. The conversation creates some tension.`,
        impact_score: 0.55,
      },
      {
        year: 2,
        title: 'Growing Uncertainty',
        description: `Your partner starts talking more seriously about marriage and family. You nod along but feel a knot in your stomach. You still aren't sure.`,
        impact_score: 0.48,
      },
      {
        year: 3,
        title: 'The Ultimatum',
        description: `Your partner finally says "I love you but I need to know where this is going." They give you a year to decide. The pressure is immense.`,
        impact_score: 0.45,
      },
      {
        year: 4,
        title: 'A Proposal Under Duress',
        description: `You propose, partly because you love them and partly because you're afraid of losing them. It feels more like capitulation than choice.`,
        impact_score: 0.50,
      },
      {
        year: 5,
        title: 'Married But Resentful',
        description: `You're married but sometimes feel resentful that you were "pushed" into it. Your spouse senses this and there's unspoken tension.`,
        impact_score: 0.52,
      },
      {
        year: 6,
        title: 'Growing Apart',
        description: `Communication has become surface-level. You're cohabiting peacefully but emotionally disconnected. You wonder if this is all married life is.`,
        impact_score: 0.48,
      },
      {
        year: 7,
        title: 'Counseling',
        description: `You finally seek therapy with your spouse. The counselor helps you both see patterns. You realize you have to actively choose them every day.`,
        impact_score: 0.55,
      },
      {
        year: 8,
        title: 'Recommitment',
        description: `Through counseling, you've learned to communicate vulnerably. You finally feel like you're in this together, not just stuck together.`,
        impact_score: 0.65,
      },
      {
        year: 10,
        title: 'Building Something Real',
        description: `A rocky start, but you've built genuine partnership through effort and honesty. You're glad you chose to stay and work on it. The marriage is good, though you'll always wonder about the road not taken.`,
        impact_score: 0.70,
      },
    ],
  };

  const decisionType = decision.toLowerCase().includes('quit')
    ? 'quit_job'
    : decision.toLowerCase().includes('move')
      ? 'move_city'
      : decision.toLowerCase().includes('propos')
        ? 'propose'
        : 'quit_job';

  const pathSuffix = isBoldPath ? '_bold' : '_safe';
  const key = (decisionType + pathSuffix) as keyof typeof scenarios;
  const events = scenarios[key] || scenarios['quit_job_bold'];

  const title = isBoldPath
    ? decisionType.includes('quit')
      ? 'Take the Leap'
      : decisionType.includes('move')
        ? 'Embrace Change'
        : 'Go All In'
    : decisionType.includes('quit')
      ? 'Stay Secure'
      : decisionType.includes('move')
        ? 'Maintain Stability'
        : 'Keep the Status Quo';

  return {
    events,
    title,
  };
}

export async function generateSimulation(
  name: string,
  age: number,
  personality: string,
  decision: string
): Promise<{
  simulation_id: string;
  paths: Array<{
    path: 'A' | 'B';
    title: string;
    events: Array<{
      id: string;
      year: number;
      title: string;
      description: string;
      impact_score: number;
      image_url?: string;
    }>;
  }>;
}> {
  const simulationId = generateId();
  const now = new Date().toISOString();

  // Generate simulation paths
  const pathA = generateSimulationEvents(name, age, personality, decision, 'A');
  const pathB = generateSimulationEvents(name, age, personality, decision, 'B');

  console.log(
    `Generating simulation for ${name}, decision: ${decision}`
  );

  // Save simulation to database
  await db
    .insertInto('simulations')
    .values({
      id: simulationId,
      user_name: name,
      user_age: age,
      user_personality: personality,
      decision_question: decision,
      path_a_title: pathA.title,
      path_b_title: pathB.title,
      created_at: now,
      updated_at: now,
    })
    .execute();

  console.log('Saved simulation to database');

  // Generate timeline events with images
  const eventResults: Array<{
    path: 'A' | 'B';
    title: string;
    events: Array<{
      id: string;
      year: number;
      title: string;
      description: string;
      impact_score: number;
      image_url?: string;
    }>;
  }> = [];

  for (const pathType of ['A', 'B'] as const) {
    const path = pathType === 'A' ? pathA : pathB;
    const pathEvents = [];

    for (const event of path.events) {
      const eventId = generateId();
      let imageUrl: string | undefined;

      // Generate age progression image for year 0, 5, and 10
      if ([0, 5, 10].includes(event.year)) {
        imageUrl = await generateAgeProgressionImage(
          name,
          age,
          event.year
        );
      }

      await db
        .insertInto('timeline_events')
        .values({
          id: eventId,
          simulation_id: simulationId,
          path: pathType,
          year: event.year,
          title: event.title,
          description: event.description,
          impact_score: event.impact_score,
          image_url: imageUrl || null,
          created_at: now,
        })
        .execute();

      pathEvents.push({
        id: eventId,
        year: event.year,
        title: event.title,
        description: event.description,
        impact_score: event.impact_score,
        image_url: imageUrl,
      });
    }

    eventResults.push({
      path: pathType,
      title: path.title,
      events: pathEvents,
    });
  }

  console.log('Simulation generation complete');

  return {
    simulation_id: simulationId,
    paths: eventResults,
  };
}
