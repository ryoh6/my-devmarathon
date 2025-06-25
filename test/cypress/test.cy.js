const { describe, it } = require("node:test");

describe("顧客情報入力フォームのテスト", () => {
  it("顧客情報を入力して送信し、成功メッセージを確認する", () => {
    cy.visit("/ryohei_yamamoto/customer/add.html"); // 登録画面にアクセス
    cy.window().then((win) => {
      // windowのalertをスタブ化し、エイリアスを設定
      cy.stub(win, "alert").as("alertStub");
    });

    // テストデータの読み込み
    cy.fixture("customerData").then((data) => {
      // フォームの入力フィールドにテストデータを入力
      const uniqueContactNumber = `03-${Math.floor(
        1000 + Math.random() * 9000
      )}-${Math.floor(1000 + Math.random() * 9000)}`;
      cy.get("#companyName").type(data.companyName);
      cy.get("#industry").type(data.industry);
      cy.get("#contact").type(uniqueContactNumber);
      cy.get("#location").type(data.location);
    });

    // フォームの送信
    cy.get("#customer-form").submit();

    // 現在の画面が確認画面であることを確認
    cy.location("pathname").should("include", "add-confirm.html");

    cy.window().then((win) => {
      // 再度windowのalertをスタブ化し、エイリアスを設定
      cy.stub(win, "alert").as("alertStub");
    });

    // 遷移後の確認画面に送信ボタンがあることを確認してクリック
    cy.get("#submit-button").should("be.visible").click();

    cy.get("@alertStub").should(
      "have.been.calledOnceWith",
      "顧客情報が正常に保存されました。"
    );

    // フォームがリセットされたことを確認
    cy.get("#companyName").should("have.value", "");
    cy.get("#industry").should("have.value", "");
    cy.get("#contact").should("have.value", "");
    cy.get("#location").should("have.value", "");
    cy.wait(5000);
  });
});

describe("顧客情報詳細画面表示のテスト", () => {
  it("顧客情報のリンクをクリックし、詳細画面に遷移することを確認する", () => {
    // 顧客情報リスト取得APIモック
    cy.intercept("GET", "**/customers", {
      statusCode: 200,
      body: [
        {
          customer_id: 1,
          company_name: "テスト株式会社",
          contact: "03-1234-5678",
        },
        {
          customer_id: 2,
          company_name: "サンプル合同会社",
          contact: "03-2345-6789",
        },
      ],
    }).as("getCustomers");

    cy.visit("/ryohei_yamamoto/customer/list.html"); // 一覧画面にアクセス

    // データの取得とDOM更新を待つ
    cy.wait("@getCustomers");

    // 顧客が2名表示されていることを確認
    cy.get("#customer-list tr").should("have.length", 2);

    // 1番目の会社名リンクのテキストとhrefを確認
    // eq()：JQueryのメソッド、複数の要素のうち何番目の要素を取得するか指定（ここでは1番目を取得）
    // within()： 指定要素内での検索（ここではリンクの有無、そのテキストとURLの有無を確認）
    cy.get("#customer-list tr")
      .eq(0)
      .within(() => {
        cy.get("a")
          .should("have.text", "テスト株式会社")
          .should("have.attr", "href", "detail.html?id=1");
      });

    // 顧客詳細情報取得APIモック
    cy.intercept("GET", "**/customers/1", {
      statusCode: 200,
      body: {
        customer_id: 1,
        company_name: "テスト株式会社",
        industry: "IT",
        contact: "03-1234-5678",
        location: "Shinjuku",
      },
    }).as("getCustomerDetail");

    // 会社名リンクをクリックして詳細画面に遷移
    cy.get("#customer-list tr").eq(0).find("a").click();

    // データの取得とDOM更新を待つ
    cy.wait("@getCustomerDetail");

    // 現在の画面が詳細画面であることを確認
    cy.location("pathname").should("include", "detail.html");
    cy.location("search").should("include", "id=1");
  });
});

describe("顧客情報更新テスト", () => {
  it("詳細情報画面で更新ボタンをクリックし、更新画面が表示されることを確認する", () => {
    // 顧客詳細情報取得APIモック
    cy.intercept("GET", "**/customers/1", {
      statusCode: 200,
      body: {
        customer_id: 1,
        company_name: "テスト株式会社",
        industry: "IT",
        contact: "03-1234-5678",
        location: "Shinjuku",
      },
    }).as("getCustomerDetail");

    // 顧客情報更新APIモック
    cy.intercept("PUT", "**/update-customer/*", {
      statusCode: 200,
      body: {
        customer_id: 1,
        company_name: "更新株式会社",
        industry: "AeroSpace",
        contact: "03-1111-1111",
        location: "Kyoto",
      },
    }).as("updateCustomer");

    cy.visit("/ryohei_yamamoto/customer/detail.html?id=1"); // id=1の詳細画面にアクセス
    // データの取得とDOM更新を待つ
    cy.wait("@getCustomerDetail");

    // 更新するボタンをクリック
    cy.get("#update-button").click();

    // 現在の画面が更新画面であることを確認
    cy.location("pathname").should("include", "update.html");
    cy.location("search").should("include", "id=1");

    cy.window().then((win) => {
      // windowのalertをスタブ化し、エイリアスを設定
      cy.stub(win, "alert").as("alertStub");
    });

    // フォームの入力フィールドを消去してから更新後のデータを入力
    cy.get("#companyName").type("{selectall}{backspace}更新株式会社");
    cy.get("#industry").type("{selectall}{backspace}AeroSpace");
    cy.get("#contact").type("{selectall}{backspace}03-1111-1111");
    cy.get("#location").type("{selectall}{backspace}Kyoto");

    // フォームの送信
    cy.get("#update-customer-form").submit();

    cy.get("@alertStub").should(
      "have.been.calledOnceWith",
      "顧客情報が正常に更新されました。"
    );

    // APIが呼ばれたことを確認
    cy.wait("@updateCustomer").then(({ request }) => {
      const bodyParams = new URLSearchParams(request.body);
      expect(bodyParams.get("company_name")).to.equal("更新株式会社");
      expect(bodyParams.get("industry")).to.equal("AeroSpace");
      expect(bodyParams.get("contact")).to.equal("03-1111-1111");
      expect(bodyParams.get("location")).to.equal("Kyoto");
    });
  });
});
