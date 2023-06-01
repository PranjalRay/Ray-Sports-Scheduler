const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
let server, agent;

function extractCsrfToken(res) {
  const $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  const csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password,
    _csrf: csrfToken,
  });
};

describe("Sport Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });
  test("Sign up", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "User A",
      email: "user.a@test.com",
      password: "12345678",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Sign out", async () => {
    let res = await agent.get("/sport");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/sport");
    expect(res.statusCode).toBe(302);
  });

  test("Creates a sport", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/sport");
    res = await agent.get("/createSport");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/sport").send({
      title: "cricket",
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Deletes a sport", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/sport");
    res = await agent.get("/createSport");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/sport").send({
      title: "Badminton",
      _csrf: csrfToken,
    });
    const groupedTodosResponse1 = await agent
      .get("/sport")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse1.text);
    const NoOfSports = parsedGroupedResponse.allSports.length;
    const latestSport = parsedGroupedResponse.allSports[NoOfSports - 1];
    res = await agent.get(`/sport/${latestSport.id}`);
    csrfToken = extractCsrfToken(res);
    const DeletedResponse = await agent
      .delete(`/sport/${latestSport.id}`)
      .send({
        _csrf: csrfToken,
      });
    const parseRes = Boolean(DeletedResponse.text);
    expect(parseRes).toBe(true);
  });

  test("Edit a Sport", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/sport");
    res = await agent.get("/createSport");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/sport").send({
      title: "Badminton",
      _csrf: csrfToken,
    });
    const groupedTodosResponse1 = await agent
      .get("/sport")
      .set("Accept", "application/json");
    let parsedGroupedResponse = JSON.parse(groupedTodosResponse1.text);
    const NoOfSports = parsedGroupedResponse.allSports.length;
    const latestSport = parsedGroupedResponse.allSports[NoOfSports - 1];
    res = await agent.get(`/sport/${latestSport.id}`);
    res = await agent.get(`/sport/edit/${latestSport.id}`);
    csrfToken = extractCsrfToken(res);
    res = await agent.post(`/sport/${latestSport.id}`).send({
      title: "Badminton2",
      _csrf: csrfToken,
    });
    const groupedTodosResponse = await agent
      .get(`/sport/${latestSport.id}`)
      .set("Accept", "application/json");
    parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const Title = parsedGroupedResponse.sport.title;
    expect(Title).toBe("Badminton2");
  });

  test("Fetches all Sports in the database using /sport endpoint", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/sport");
    res = await agent.get("/createSport");
    // expect(res.statusCode).toBe(200)
    let csrfToken = extractCsrfToken(res);
    await agent.post("/sport").send({
      title: "Tennis",
      _csrf: csrfToken,
    });
    const groupedTodosResponse1 = await agent
      .get("/sport")
      .set("Accept", "application/json");
    const parsedGroupedResponse1 = JSON.parse(groupedTodosResponse1.text);
    const NoOfSports = parsedGroupedResponse1.allSports.length;

    res = await agent.get("/sport");
    res = await agent.get("/createSport");
    csrfToken = extractCsrfToken(res);
    await agent.post("/sport").send({
      title: "Badminton",
      _csrf: csrfToken,
    });
    const groupedTodosResponse = await agent
      .get("/sport")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const NoOfSports1 = parsedGroupedResponse.allSports.length;
    const latestSport = parsedGroupedResponse.allSports[NoOfSports1 - 1];
    expect(NoOfSports1).toBe(NoOfSports + 1);
    expect(latestSport.title).toBe("Badminton");
  });

  test("Creates a Session", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/sport");
    res = await agent.get("/createSport");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/sport").send({
      title: "Cricket",
      _csrf: csrfToken,
    });
    const groupedTodosResponse1 = await agent
      .get("/sport")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse1.text);
    const NoOfSports = parsedGroupedResponse.allSports.length;
    const latestSport = parsedGroupedResponse.allSports[NoOfSports - 1];
    res = await agent.get(`/sport/${latestSport.id}`);
    res = await agent.get(`/sport/sessions/${latestSport.id}`);
    csrfToken = extractCsrfToken(res);
    res = await agent.post(`/createSession/${latestSport.id}`).send({
      sessionName: "Cricket Session #1",
      date: new Date().toISOString(),
      time: "15:41:00",
      venue: "Hyderabad",
      names: "Sneha,Ankith",
      playersNeeded: 2,
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Fetches all Pariticular sport Sessions created by user ", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/sport");
    res = await agent.get("/createSport");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/sport").send({
      title: "Cricket",
      _csrf: csrfToken,
    });
    let groupedTodosResponse1 = await agent
      .get("/sport")
      .set("Accept", "application/json");
    let parsedGroupedResponse = JSON.parse(groupedTodosResponse1.text);
    const NoOfSports = parsedGroupedResponse.allSports.length;
    const latestSport = parsedGroupedResponse.allSports[NoOfSports - 1];
    res = await agent.get(`/sport/${latestSport.id}`);
    res = await agent.get(`/sport/sessions/${latestSport.id}`);
    csrfToken = extractCsrfToken(res);
    res = await agent.post(`/createSession/${latestSport.id}`).send({
      sessionName: "Cricket Session #1",
      date: new Date().toISOString(),
      time: "15:41:00",
      venue: "Hyderabad",
      names: "Sneha,Ankith",
      playersNeeded: 2,
      _csrf: csrfToken,
    });
    groupedTodosResponse1 = await agent
      .get(`/sport/${latestSport.id}`)
      .set("Accept", "application/json");
    parsedGroupedResponse = JSON.parse(groupedTodosResponse1.text);
    const NoOfSportSessions = parsedGroupedResponse.allSessionPart.length;

    res = await agent.get(`/sport/${latestSport.id}`);
    res = await agent.get(`/sport/sessions/${latestSport.id}`);
    csrfToken = extractCsrfToken(res);
    res = await agent.post(`/createSession/${latestSport.id}`).send({
      sessionName: "Cricket Session #2",
      date: new Date().toISOString(),
      time: "17:41:00",
      venue: "Hyderabad",
      names: "Sneha,Priya",
      playersNeeded: 2,
      _csrf: csrfToken,
    });
    groupedTodosResponse1 = await agent
      .get(`/sport/${latestSport.id}`)
      .set("Accept", "application/json");
    parsedGroupedResponse = JSON.parse(groupedTodosResponse1.text);
    const NoOfSportSessions2 = parsedGroupedResponse.allSessionPart.length;
    expect(NoOfSportSessions2).toBe(NoOfSportSessions + 1);
  });

  test("Fetches all upcoming Sessions of a particular sport", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/sport");
    res = await agent.get("/createSport");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/sport").send({
      title: "Cricket",
      _csrf: csrfToken,
    });
    let groupedTodosResponse1 = await agent
      .get("/sport")
      .set("Accept", "application/json");
    let parsedGroupedResponse = JSON.parse(groupedTodosResponse1.text);
    const NoOfSports = parsedGroupedResponse.allSports.length;
    const latestSport = parsedGroupedResponse.allSports[NoOfSports - 1];
    res = await agent.get(`/sport/${latestSport.id}`);
    res = await agent.get(`/sport/sessions/${latestSport.id}`);
    csrfToken = extractCsrfToken(res);
    const dateToday = new Date();
    res = await agent.post(`/createSession/${latestSport.id}`).send({
      sessionName: "Cricket Session #1",
      date: new Date(new Date().setDate(dateToday.getDate() + 1)).toISOString(),
      time: "15:41:00",
      venue: "Hyderabad",
      names: "Sneha,Ankith",
      playersNeeded: 2,
      _csrf: csrfToken,
    });
    groupedTodosResponse1 = await agent
      .get(`/sport/${latestSport.id}`)
      .set("Accept", "application/json");
    parsedGroupedResponse = JSON.parse(groupedTodosResponse1.text);
    const NoOfSportSessions = parsedGroupedResponse.allUpcoming.length;

    res = await agent.get(`/sport/${latestSport.id}`);
    res = await agent.get(`/sport/sessions/${latestSport.id}`);
    csrfToken = extractCsrfToken(res);
    res = await agent.post(`/createSession/${latestSport.id}`).send({
      sessionName: "Cricket Session #2",
      date: new Date(new Date().setDate(dateToday.getDate() + 1)).toISOString(),
      time: "17:41:00",
      venue: "Hyderabad",
      names: "Sneha,Priya",
      playersNeeded: 2,
      _csrf: csrfToken,
    });
    groupedTodosResponse1 = await agent
      .get(`/sport/${latestSport.id}`)
      .set("Accept", "application/json");
    parsedGroupedResponse = JSON.parse(groupedTodosResponse1.text);
    const NoOfSportSessions2 = parsedGroupedResponse.allUpcoming.length;
    expect(NoOfSportSessions2).toBe(NoOfSportSessions + 1);
  });

  test("Fetches all previous Sessions of a particular sport", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/sport");
    res = await agent.get("/createSport");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/sport").send({
      title: "Cricket",
      _csrf: csrfToken,
    });
    let groupedTodosResponse1 = await agent
      .get("/sport")
      .set("Accept", "application/json");
    let parsedGroupedResponse = JSON.parse(groupedTodosResponse1.text);
    const NoOfSports = parsedGroupedResponse.allSports.length;
    const latestSport = parsedGroupedResponse.allSports[NoOfSports - 1];
    res = await agent.get(`/sport/${latestSport.id}`);
    res = await agent.get(`/sport/sessions/${latestSport.id}`);
    csrfToken = extractCsrfToken(res);
    const dateToday = new Date();
    res = await agent.post(`/createSession/${latestSport.id}`).send({
      sessionName: "Cricket Session #1",
      date: new Date(new Date().setDate(dateToday.getDate() - 1)).toISOString(),
      time: "15:41:00",
      venue: "Hyderabad",
      names: "Sneha,Ankith",
      playersNeeded: 2,
      _csrf: csrfToken,
    });
    groupedTodosResponse1 = await agent
      .get(`/sport/viewPreSessions/${latestSport.id}`)
      .set("Accept", "application/json");
    parsedGroupedResponse = JSON.parse(groupedTodosResponse1.text);
    const NoOfSportSessions = parsedGroupedResponse.allPrevious.length;

    res = await agent.get(`/sport/${latestSport.id}`);
    res = await agent.get(`/sport/sessions/${latestSport.id}`);
    csrfToken = extractCsrfToken(res);
    res = await agent.post(`/createSession/${latestSport.id}`).send({
      sessionName: "Cricket Session #2",
      date: new Date(new Date().setDate(dateToday.getDate() - 1)).toISOString(),
      time: "17:41:00",
      venue: "Hyderabad",
      names: "Sneha,Priya",
      playersNeeded: 2,
      _csrf: csrfToken,
    });
    groupedTodosResponse1 = await agent
      .get(`/sport/viewPreSessions/${latestSport.id}`)
      .set("Accept", "application/json");
    parsedGroupedResponse = JSON.parse(groupedTodosResponse1.text);
    const NoOfSportSessions2 = parsedGroupedResponse.allPrevious.length;
    expect(NoOfSportSessions2).toBe(NoOfSportSessions + 1);
  });

  test("Deleting Player in the particular session", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "12345678");
    let res = await agent.get("/sport");
    res = await agent.get("/createSport");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/sport").send({
      title: "Cricket",
      _csrf: csrfToken,
    });
    let groupedTodosResponse1 = await agent
      .get("/sport")
      .set("Accept", "application/json");
    let parsedGroupedResponse = JSON.parse(groupedTodosResponse1.text);
    const NoOfSports = parsedGroupedResponse.allSports.length;
    const latestSport = parsedGroupedResponse.allSports[NoOfSports - 1];
    res = await agent.get(`/sport/${latestSport.id}`);
    res = await agent.get(`/sport/sessions/${latestSport.id}`);
    csrfToken = extractCsrfToken(res);
    const dateToday = new Date();
    res = await agent.post(`/createSession/${latestSport.id}`).send({
      sessionName: "Cricket Session #1",
      date: new Date(new Date().setDate(dateToday.getDate() + 1)).toISOString(),
      time: "15:41:00",
      venue: "Hyderabad",
      names: "Sneha,Ankith",
      playersNeeded: 2,
      _csrf: csrfToken,
    });
    groupedTodosResponse1 = await agent
      .get(`/sport/${latestSport.id}`)
      .set("Accept", "application/json");
    parsedGroupedResponse = JSON.parse(groupedTodosResponse1.text);
    const NoOfSportSessions = parsedGroupedResponse.allUpcoming.length;
    const latestSession =
      parsedGroupedResponse.allUpcoming[NoOfSportSessions - 1];

    groupedTodosResponse1 = await agent
      .get(`/sport/partSession/${latestSession.id}`)
      .set("Accept", "application/json");
    parsedGroupedResponse = JSON.parse(groupedTodosResponse1.text);
    const NoOfPlayers = parsedGroupedResponse.Players.length;
    const latestPlayer = parsedGroupedResponse.Players[NoOfPlayers - 1];
    res = await agent.get(`/sport/partSession/${latestSession.id}`);
    csrfToken = extractCsrfToken(res);
    const DeletedResponse = await agent
      .delete(`/playerSession/${latestPlayer.id}`)
      .send({
        _csrf: csrfToken,
      });
    const parseRes = Boolean(DeletedResponse.text);
    expect(parseRes).toBe(true);
  });
});
