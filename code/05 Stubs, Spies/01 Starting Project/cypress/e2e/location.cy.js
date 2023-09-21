/// <reference types="cypress" />

describe('share location', () => {
  beforeEach(() => {
    cy.clock();
    cy.fixture('user-location.json').as('userLocation');
    cy.visit('/').then((window) => {
      cy.get('@userLocation').then((fakePosition) => {
        cy.stub(window.navigator.geolocation, 'getCurrentPosition')
          .as('getUserPosition')
          .callsFake((callback) => {
            setTimeout(() => {
              callback(fakePosition);
            }, 1000);
          });
      });
      cy.stub(window.navigator.clipboard, 'writeText')
        .as('saveToClipboard')
        .resolves();
      cy.spy(window.localStorage, 'setItem').as('storeLocation');
      cy.spy(window.localStorage, 'getItem').as('getStoreLocation');
    });

  });

  it('should fetch the user location', () => {
    cy.get('[data-cy="get-loc-btn"]').as('submitBtn').click();
    cy.get('@getUserPosition').should('have.been.called');
    cy.get('@submitBtn').should('be.disabled');
    cy.get('[data-cy="actions"]').should('contain.text', 'fetched');
  });

  it('should copy value to the clipboard', () => {
    cy.get('[data-cy="name-input"]').type('John Doe');
    cy.get('[data-cy="get-loc-btn"]').as('submitBtn').click();
    cy.get('[data-cy="share-loc-btn"]').click();
    cy.get('@saveToClipboard').should('have.been.called');
    cy.fixture('user-location.json').then((fakePosition) => {
      const {latitude, longitude} = fakePosition.coords;
      cy.get('@saveToClipboard').should('have.been.calledWithMatch',
        new RegExp(`${latitude}.*${longitude}.*${encodeURI('John Doe')}`)
      );
    });
    cy.get('@storeLocation').should('have.been.called')

    // Manipulate the clock.
    cy.get('[data-cy="info-message"]').should('be.visible');
    // Advancing the time 2s forward.
    cy.tick(2000);
    cy.get('[data-cy="info-message"]').should('not.be.visible');
  });
});
