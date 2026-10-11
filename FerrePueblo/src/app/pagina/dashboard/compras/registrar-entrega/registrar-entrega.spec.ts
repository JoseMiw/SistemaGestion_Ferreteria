import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarEntrega } from './registrar-entrega';

describe('RegistrarEntrega', () => {
  let component: RegistrarEntrega;
  let fixture: ComponentFixture<RegistrarEntrega>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarEntrega],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrarEntrega);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
