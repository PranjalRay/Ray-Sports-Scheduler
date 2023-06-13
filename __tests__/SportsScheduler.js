
const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
const { User, Sport } = require("../models");
const { response } = require("../app");
let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}
const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};
describe("Ray Sport Scheduler Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(10000, () => {});
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
      lastName: "user A",
      email: "admin@admin.com",
      password: "admin",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
  test("Sign out", async () => {
    let res = await agent.get("/sportList");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/sportList");
    expect(res.statusCode).toBe(302);
  });
  test("Creates new Sport", async () => {
    const agent = request.agent(server);
    const user = await User.findOne({where:{email:"admin@admin.com"}});
    await login(agent, "admin@admin.com", "admin");
    let res = await agent.get(`/admin/createSport/${user.id}`);
    let csrfToken = extractCsrfToken(res);
    const response = await agent
      .post(`/admin/createSport/${user.id}`)
      .send({
        SportName: "NEW TEST",
        _csrf: csrfToken,
      })
      .expect(302);
    expect(response.header["location"]).toBe("/SportList");
    const createdSport = await Sport.findOne({ where: { SportName: "NEW TEST" } });
    expect(createdSport).not.toBeNull();
    expect(createdSport.userId).toBe(user.id);
  });
  test("Creates new Session", async () => {
    const agent = request.agent(server);
    const user = await User.findOne({where:{email:"admin@admin.com"}});
    let setDate = new Date().toISOString();
    await login(agent, "admin@admin.com", "admin");
    let res = await agent.get(`/sessionCreate/${user.id}/undefined/undefined`);
    let csrfToken = extractCsrfToken(res);
    const response = await agent
      .post(`/sessionCreate/${user.id}/undefined/undefined`)
      .send({
        date: setDate,
        time: "11:19",
        place: "school",
        player: "a,b",
        TotalPlayer: 5,
        sportId: 1,
        userId: user.id,
        playerId: 1,
        SportName: "NEW TEST",
        isJoined: false,
        _csrf: csrfToken,
      });
    expect(response.statusCode).toBe(302);
  });
});
