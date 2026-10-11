import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarDevolucion } from './registrar-devolucion';

describe('RegistrarDevolucion', () => {
  let component: RegistrarDevolucion;
  let fixture: ComponentFixture<RegistrarDevolucion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarDevolucion],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrarDevolucion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
