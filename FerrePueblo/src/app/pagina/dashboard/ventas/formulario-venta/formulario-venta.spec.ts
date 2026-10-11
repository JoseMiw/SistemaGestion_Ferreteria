import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormularioVenta } from './formulario-venta';

describe('FormularioVenta', () => {
  let component: FormularioVenta;
  let fixture: ComponentFixture<FormularioVenta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioVenta],
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioVenta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
